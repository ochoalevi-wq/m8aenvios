import SwiftUI

struct MessengersView: View {
    @Environment(AppStore.self) private var store
    @State private var expandedMessenger: String?
    @State private var expandedDelivery: String?
    @State private var showAddModal = false
    @State private var newName = ""
    @State private var newPhone = ""
    @State private var newLicense: LicenseType?
    @State private var newVehicle: VehicleType?
    @State private var showAlert = false
    @State private var alertMessage = ""

    private var isMessenger: Bool { store.currentUser?.role == .messenger }
    private var messengerStatsList: [MessengerStats] { store.messengerStatsList() }
    private var topPerformer: MessengerStats? { store.topPerformer }

    var body: some View {
        Group {
            if isMessenger {
                messengerSelfView
            } else if messengerStatsList.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "truck.box").font(.system(size: 64)).foregroundStyle(.secondary)
                    Text("No hay mensajeros registrados").font(.system(size: 18, weight: .semibold))
                    Text("Los mensajeros aparecerán aquí cuando crees envíos").font(.system(size: 14)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                adminMessengerView
            }
        }
        .background(Color(.systemBackground))
        .sheet(isPresented: $showAddModal) {
            addMessengerSheet
        }
        .alert("Mensaje", isPresented: $showAlert) {
            Button("OK") {}
        } message: { Text(alertMessage) }
    }

    // MARK: - Messenger Self View
    private var messengerSelfView: some View {
        let myId = store.currentUser?.id ?? ""
        let myDeliveries = store.deliveries.filter { $0.messengerId == myId }
        let myStats = store.myDeliveryStats(userId: myId)

        return Group {
            if myDeliveries.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "truck.box").font(.system(size: 64)).foregroundStyle(.secondary)
                    Text("No tienes paquetes asignados").font(.system(size: 18, weight: .semibold))
                    Text("Tus entregas aparecerán aquí cuando te sean asignadas").font(.system(size: 14)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        // Welcome card
                        VStack(spacing: 20) {
                            HStack(spacing: 16) {
                                ZStack {
                                    Circle().fill(Color.white.opacity(0.15)).frame(width: 64, height: 64)
                                    Image(systemName: "person.fill").font(.system(size: 28)).foregroundStyle(.white)
                                }
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Bienvenido").font(.system(size: 14)).foregroundStyle(.white.opacity(0.8))
                                    Text(store.currentUser?.name ?? "").font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
                                }
                                Spacer()
                            }
                            HStack(spacing: 12) {
                                msStatBox("\(myStats.total)", "Total", .white)
                                msStatBox("\(myStats.pending)", "Pendientes", .yellow)
                                msStatBox("\(myStats.inTransit)", "En Tránsito", .orange)
                                msStatBox("\(myStats.delivered)", "Entregados", .green)
                            }
                        }
                        .padding(20)
                        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Mis Entregas").font(.system(size: 20, weight: .bold))
                            Text("\(myDeliveries.count) paquetes asignados").font(.system(size: 13)).foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        ForEach(myDeliveries) { delivery in
                            messengerDeliveryCard(delivery)
                        }
                    }
                    .padding(16)
                }
            }
        }
    }

    private func msStatBox(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 24, weight: .bold)).foregroundStyle(color)
            Text(label).font(.system(size: 11)).foregroundStyle(.white.opacity(0.8))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func messengerDeliveryCard(_ delivery: Delivery) -> some View {
        let isExpanded = expandedDelivery == delivery.id
        return VStack(spacing: 12) {
            Button {
                withAnimation { expandedDelivery = isExpanded ? nil : delivery.id }
            } label: {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(statusIndicator(delivery.status))
                        .frame(width: 8, height: 48)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("#\(delivery.shortId)").font(.system(size: 12, weight: .semibold)).foregroundStyle(.secondary)
                        Text(delivery.receiver.name).font(.system(size: 18, weight: .bold)).foregroundStyle(.primary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 8) {
                        statusBadgeSmall(delivery.status)
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 14)).foregroundStyle(.secondary)
                    }
                }
            }
            .buttonStyle(.plain)

            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "mappin.and.ellipse").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(delivery.zone.label).font(.system(size: 14)).foregroundStyle(.secondary)
                }
                Spacer()
                Text("Q \(delivery.total, specifier: "%.2f")").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }
            .padding(.top, 12)
            .overlay(alignment: .top) { Divider() }

            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    detailSection(title: "Remitente") {
                        detailRow("person.fill", delivery.sender.name)
                        detailRow("phone.fill", "+502 \(delivery.sender.phone)")
                        detailRow("mappin.and.ellipse", delivery.sender.address)
                    }
                    detailSection(title: "Destinatario") {
                        detailRow("person.fill", delivery.receiver.name)
                        detailRow("phone.fill", "+502 \(delivery.receiver.phone)")
                        detailRow("mappin.and.ellipse", delivery.receiver.address)
                    }
                    if let desc = delivery.description, !desc.isEmpty {
                        detailSection(title: "Descripción") { Text(desc).font(.system(size: 14)) }
                    }
                    detailSection(title: "Costos") {
                        HStack { Text("Costo del paquete:").foregroundStyle(.secondary); Spacer(); Text("Q \(delivery.packageCost, specifier: "%.2f")").fontWeight(.semibold) }
                        HStack { Text("Costo de envío:").foregroundStyle(.secondary); Spacer(); Text("Q \(delivery.shippingCost, specifier: "%.2f")").fontWeight(.semibold) }
                        Divider()
                        HStack { Text("Total:").font(.system(size: 16, weight: .bold)); Spacer(); Text("Q \(delivery.total, specifier: "%.2f")").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32)) }
                    }

                    // Actions
                    VStack(spacing: 12) {
                        Button {
                            // Camera placeholder for simulator
                            alertMessage = "Instala esta app en tu dispositivo para usar la cámara."
                            showAlert = true
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "camera.fill")
                                Text(delivery.photos?.isEmpty == false ? "Agregar Foto" : "Tomar Foto")
                            }
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(red: 0.42, green: 0.46, blue: 0.52))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        if delivery.status == .pending {
                            actionButton("Iniciar Entrega", "truck.box.fill", Color(red: 0.29, green: 0.33, blue: 0.39)) {
                                store.updateDeliveryStatus(id: delivery.id, status: .inTransit)
                            }
                        }
                        if delivery.status == .inTransit {
                            actionButton("Marcar como Entregado", "checkmark.circle.fill", Color(red: 0.22, green: 0.27, blue: 0.32)) {
                                if delivery.photos?.isEmpty != false {
                                    alertMessage = "Debes tomar una foto del paquete antes de marcarlo como entregado."
                                    showAlert = true
                                } else {
                                    store.updateDeliveryStatus(id: delivery.id, status: .delivered)
                                }
                            }
                            HStack(spacing: 8) {
                                actionButton("Reprogramar", "arrow.clockwise", .orange) {
                                    store.updateDelivery(id: delivery.id, updates: ["status": DeliveryStatus.rescheduled, "rescheduledDate": ISO8601DateFormatter().string(from: Date())])
                                }
                                actionButton("No Entregado", "xmark.circle.fill", .red) {
                                    store.updateDelivery(id: delivery.id, updates: ["status": DeliveryStatus.notDelivered, "notDeliveredReason": "No especificado"])
                                }
                            }
                        }
                    }
                }
                .padding(.top, 16)
                .overlay(alignment: .top) { Divider() }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    // MARK: - Admin Messenger View
    private var adminMessengerView: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let top = topPerformer {
                    topPerformerCard(top)
                }

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Todos los Mensajeros").font(.system(size: 20, weight: .bold))
                        Text("\(messengerStatsList.count) mensajeros activos").font(.system(size: 13)).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { showAddModal = true } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "person.badge.plus")
                            Text("Añadir")
                        }
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }

                ForEach(messengerStatsList) { stats in
                    messengerStatsCard(stats)
                }
            }
            .padding(16)
        }
    }

    private func topPerformerCard(_ top: MessengerStats) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                Image(systemName: "rosette").font(.system(size: 32)).foregroundStyle(.yellow)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Mejor Mensajero").font(.system(size: 13)).foregroundStyle(.secondary)
                    Text(top.name).font(.system(size: 20, weight: .bold))
                }
                Spacer()
            }
            HStack(spacing: 12) {
                VStack(spacing: 4) {
                    Text("\(top.completionRate, specifier: "%.0f")%").font(.system(size: 20, weight: .bold))
                    Text("Tasa de Entrega").font(.system(size: 11)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                VStack(spacing: 4) {
                    Text("\(top.delivered)").font(.system(size: 20, weight: .bold))
                    Text("Entregados").font(.system(size: 11)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                VStack(spacing: 4) {
                    Text("Q \(top.totalRevenue, specifier: "%.0f")").font(.system(size: 20, weight: .bold))
                    Text("Ingresos").font(.system(size: 11)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(20)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    private func messengerStatsCard(_ stats: MessengerStats) -> some View {
        let isExpanded = expandedMessenger == stats.id
        return VStack(spacing: 16) {
            Button {
                withAnimation { expandedMessenger = isExpanded ? nil : stats.id }
            } label: {
                HStack(spacing: 12) {
                    ZStack {
                        Circle().fill(Color.blue.opacity(0.15)).frame(width: 48, height: 48)
                        Image(systemName: "truck.box.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(stats.name).font(.system(size: 16, weight: .semibold))
                        Text("\(stats.totalDeliveries) envíos totales").font(.system(size: 13)).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 18)).foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)

            if let cred = stats.credential {
                VStack(spacing: 12) {
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Teléfono").font(.system(size: 11)).foregroundStyle(.secondary)
                            Text("+502 \(cred.phoneNumber)").font(.system(size: 14, weight: .medium))
                        }
                        Spacer()
                        if let lic = cred.licenseType {
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("Licencia").font(.system(size: 11)).foregroundStyle(.secondary)
                                Text(lic.label).font(.system(size: 14, weight: .medium))
                            }
                        }
                    }
                    if let veh = cred.vehicleType {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Vehículo").font(.system(size: 11)).foregroundStyle(.secondary)
                                Text(veh.label).font(.system(size: 14, weight: .medium))
                            }
                            Spacer()
                        }
                    }
                }
                .padding(12)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            // Stats grid
            HStack(spacing: 8) {
                statBox(value: "\(stats.delivered)", label: "Entregados", color: .green)
                statBox(value: "\(stats.inTransit)", label: "En Tránsito", color: .blue)
                statBox(value: "\(stats.pending)", label: "Pendientes", color: .orange)
            }

            // Metrics
            VStack(spacing: 8) {
                HStack {
                    Text("Tasa de Entrega:").font(.system(size: 14))
                    Spacer()
                    Text("\(stats.completionRate, specifier: "%.0f")%").font(.system(size: 14, weight: .semibold))
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4).fill(Color(.tertiarySystemBackground)).frame(height: 8)
                        RoundedRectangle(cornerRadius: 4).fill(Color(red: 0.22, green: 0.27, blue: 0.32))
                            .frame(width: geo.size.width * min(stats.completionRate / 100, 1), height: 8)
                    }
                }
                .frame(height: 8)

                HStack {
                    Text("Ingresos Totales:").font(.system(size: 14))
                    Spacer()
                    Text("Q \(stats.totalRevenue, specifier: "%.2f")").font(.system(size: 14, weight: .bold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                }
                HStack {
                    Text("Promedio por Envío:").font(.system(size: 14))
                    Spacer()
                    Text("Q \(stats.averageDeliveryValue, specifier: "%.2f")").font(.system(size: 14, weight: .semibold))
                }
            }

            if isExpanded {
                let recent = store.deliveries.filter { $0.messengerId == stats.id }.sorted { $0.createdAt > $1.createdAt }.prefix(5)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Envíos Recientes").font(.system(size: 14, weight: .bold))
                    ForEach(Array(recent), id: \.id) { d in
                        HStack {
                            Text("#\(d.shortId)").font(.system(size: 12)).foregroundStyle(.secondary)
                            Text(d.receiver.name).font(.system(size: 14))
                            Spacer()
                            Text("Q \(d.total, specifier: "%.2f")").font(.system(size: 14, weight: .semibold))
                        }
                        .padding(.vertical, 6)
                    }
                }
                .padding(.top, 8)
                .overlay(alignment: .top) { Divider() }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    private func statBox(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 18, weight: .bold))
            Text(label).font(.system(size: 11)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Add Messenger Sheet
    private var addMessengerSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 12) {
                        ZStack {
                            Circle().fill(Color.blue.opacity(0.15)).frame(width: 56, height: 56)
                            Image(systemName: "person.badge.plus").font(.system(size: 28)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                        }
                        VStack(spacing: 4) {
                            Text("Añadir Mensajero").font(.system(size: 20, weight: .bold))
                            Text("Completa los datos del nuevo mensajero").font(.system(size: 14)).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Nombre Completo").font(.system(size: 14, weight: .semibold))
                        HStack(spacing: 8) {
                            Image(systemName: "person.fill").foregroundStyle(.secondary)
                            TextField("Ej: Juan Pérez", text: $newName)
                                .textInputAutocapitalization(.words)
                        }
                        .padding(.horizontal, 12).frame(height: 48)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Número de Teléfono").font(.system(size: 14, weight: .semibold))
                        HStack(spacing: 8) {
                            Image(systemName: "phone.fill").foregroundStyle(.secondary)
                            Text("+502").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            TextField("12345678", text: $newPhone)
                                .keyboardType(.phonePad)
                        }
                        .padding(.horizontal, 12).frame(height: 48)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Tipo de Licencia").font(.system(size: 14, weight: .semibold))
                        HStack(spacing: 8) {
                            ForEach(LicenseType.allCases, id: \.self) { type in
                                Button { newLicense = type } label: {
                                    HStack(spacing: 4) {
                                        Image(systemName: "creditcard.fill").font(.system(size: 14))
                                        Text(type.label).font(.system(size: 13, weight: .medium))
                                    }
                                    .foregroundStyle(newLicense == type ? .white : Color(red: 0.22, green: 0.27, blue: 0.32))
                                    .padding(.horizontal, 12).padding(.vertical, 10)
                                    .background(newLicense == type ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Vehículo").font(.system(size: 14, weight: .semibold))
                        VStack(spacing: 8) {
                            ForEach(VehicleType.allCases, id: \.self) { type in
                                Button { newVehicle = type } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "car.fill").font(.system(size: 16))
                                        Text(type.label).font(.system(size: 14, weight: .medium))
                                        Spacer()
                                        if newVehicle == type {
                                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
                                        }
                                    }
                                    .foregroundStyle(newVehicle == type ? .white : .primary)
                                    .padding(.horizontal, 14).padding(.vertical, 12)
                                    .background(newVehicle == type ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                    }

                    Button { handleAdd() } label: {
                        Text("Añadir Mensajero")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.bottom, 24)
                }
                .padding(20)
            }
            .navigationTitle("Nuevo Mensajero")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancelar") { showAddModal = false }
                }
            }
        }
    }

    private func handleAdd() {
        let name = newName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { alert("El nombre completo es obligatorio"); return }
        guard !newPhone.trimmingCharacters(in: .whitespaces).isEmpty else { alert("El número de teléfono es obligatorio"); return }
        guard let lic = newLicense else { alert("Selecciona un tipo de licencia"); return }
        guard let veh = newVehicle else { alert("Selecciona un tipo de vehículo"); return }

        let parts = name.split(separator: " ")
        let firstName = String(parts.first ?? "")
        let lastName = parts.count > 1 ? parts.dropFirst().joined(separator: " ") : "Mensajero"
        let username = (firstName.lowercased() + String(lastName.first ?? Character("m")).lowercased())

        let cred = Credential(
            id: "\(Date().timeIntervalSince1970)",
            username: username, password: "123456", role: .messenger,
            firstName: firstName, lastName: lastName,
            phoneNumber: newPhone.trimmingCharacters(in: .whitespaces),
            createdAt: ISO8601DateFormatter().string(from: Date()),
            age: nil, licenseType: lic, vehicleType: veh
        )
        store.addCredential(cred)
        newName = ""; newPhone = ""; newLicense = nil; newVehicle = nil
        showAddModal = false
        alert("Mensajero \"\(name)\" añadido correctamente")
    }

    // MARK: - Helpers
    private func statusIndicator(_ s: DeliveryStatus) -> Color {
        switch s {
        case .pending: Color(red: 0.61, green: 0.64, blue: 0.69)
        case .inTransit: Color(red: 0.42, green: 0.46, blue: 0.52)
        case .delivered: Color(red: 0.22, green: 0.27, blue: 0.32)
        case .rescheduled: Color.orange
        case .notDelivered: Color.red
        case .cancelled: Color.red
        }
    }

    private func statusBadgeSmall(_ s: DeliveryStatus) -> some View {
        Text(s.label).font(.system(size: 11, weight: .bold))
            .padding(.horizontal, 10).padding(.vertical, 6)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .background(badgeBg(s))
    }

    private func badgeBg(_ s: DeliveryStatus) -> Color {
        switch s {
        case .pending: Color.yellow.opacity(0.2)
        case .inTransit: Color.blue.opacity(0.15)
        case .delivered: Color.green.opacity(0.15)
        case .cancelled, .notDelivered: Color.red.opacity(0.15)
        case .rescheduled: Color.orange.opacity(0.15)
        }
    }

    @ViewBuilder
    private func detailSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 14, weight: .bold))
            content()
        }
    }

    private func detailRow(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(.secondary)
            Text(text).font(.system(size: 14))
            Spacer()
        }
    }

    private func actionButton(_ title: String, _ icon: String, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 18))
                Text(title).font(.system(size: 14, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    private func alert(_ msg: String) { alertMessage = msg; showAlert = true }
}
