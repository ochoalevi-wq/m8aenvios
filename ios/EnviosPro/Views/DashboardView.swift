import SwiftUI

struct DashboardView: View {
    @Environment(AppStore.self) private var store
    @State private var expandedDelivery: String?
    @State private var showLogoOptions = false

    private var isMessenger: Bool { store.currentUser?.role == .messenger }
    private var isAdmin: Bool { store.currentUser?.role == .admin }

    private var myDeliveries: [Delivery] {
        if isMessenger, let uid = store.currentUser?.id {
            return store.deliveries.filter { $0.messengerId == uid }
        }
        return store.deliveries
    }

    private var myStats: DeliveryStats {
        if isMessenger, let uid = store.currentUser?.id {
            return store.myDeliveryStats(userId: uid)
        }
        return store.deliveryStats
    }

    private var recentDeliveries: [Delivery] {
        myDeliveries.sorted { $0.createdAt > $1.createdAt }.prefix(5).map { $0 }
    }

    var body: some View {
        Group {
            if isMessenger {
                messengerView
            } else {
                adminView
            }
        }
        .background(Color(red: 0.95, green: 0.96, blue: 0.97))
        .confirmationDialog("Cambiar Logo", isPresented: $showLogoOptions, titleVisibility: .visible) {
            Button("Galería") { /* PhotoPicker would go here */ }
            Button("Cámara") { /* Camera would go here */ }
            if store.logo != nil {
                Button("Eliminar", role: .destructive) { store.updateLogo(nil) }
            }
            Button("Cancelar", role: .cancel) {}
        }
    }

    // MARK: - Messenger View
    private var messengerView: some View {
        Group {
            if myDeliveries.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "truck.box")
                        .font(.system(size: 64))
                        .foregroundStyle(Color(red: 0.61, green: 0.64, blue: 0.69))
                    Text("No tienes paquetes asignados")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(.primary)
                    Text("Tus entregas aparecerán aquí cuando te sean asignadas")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        messengerWelcomeCard
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Mis Entregas").font(.system(size: 20, weight: .bold))
                            Text("\(myDeliveries.count) paquetes asignados")
                                .font(.system(size: 13)).foregroundStyle(.secondary)
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

    private var messengerWelcomeCard: some View {
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
                statBox(value: "\(myStats.total)", label: "Total")
                statBox(value: "\(myStats.pending)", label: "Pendientes")
                statBox(value: "\(myStats.inTransit)", label: "En Tránsito")
                statBox(value: "\(myStats.delivered)", label: "Entregados")
            }
        }
        .padding(20)
        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
    }

    private func statBox(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
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
                        .fill(statusColor(delivery.status))
                        .frame(width: 8, height: 48)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("#\(delivery.shortId)").font(.system(size: 12, weight: .semibold)).foregroundStyle(.secondary)
                        Text(delivery.receiver.name).font(.system(size: 18, weight: .bold)).foregroundStyle(.primary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 8) {
                        statusBadge(delivery.status)
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .buttonStyle(.plain)

            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "mappin.and.ellipse").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(delivery.zone.label.uppercased()).font(.system(size: 14)).foregroundStyle(.secondary)
                }
                Spacer()
                Text("Q \(delivery.total, specifier: "%.2f")")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }
            .padding(.top, 12)
            .overlay(alignment: .top) { Divider() }

            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    detailSection(title: "Remitente") {
                        detailRow(icon: "person.fill", text: delivery.sender.name)
                        detailRow(icon: "phone.fill", text: delivery.sender.phone)
                        detailRow(icon: "mappin.and.ellipse", text: delivery.sender.address)
                    }
                    detailSection(title: "Destinatario") {
                        detailRow(icon: "person.fill", text: delivery.receiver.name)
                        detailRow(icon: "phone.fill", text: delivery.receiver.phone)
                        detailRow(icon: "mappin.and.ellipse", text: delivery.receiver.address)
                    }
                    if let desc = delivery.description, !desc.isEmpty {
                        detailSection(title: "Descripción") {
                            Text(desc).font(.system(size: 14)).foregroundStyle(.primary)
                        }
                    }
                    detailSection(title: "Costos") {
                        costRow(label: "Costo del paquete:", value: delivery.packageCost)
                        costRow(label: "Costo de envío:", value: delivery.shippingCost)
                        Divider()
                        HStack {
                            Text("Total:").font(.system(size: 16, weight: .bold))
                            Spacer()
                            Text("Q \(delivery.total, specifier: "%.2f")")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                        }
                    }
                    deliveryActions(delivery)
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

    private func deliveryActions(_ delivery: Delivery) -> some View {
        VStack(spacing: 12) {
            if delivery.status == .pending {
                actionButton(title: "Iniciar Entrega", icon: "truck.box.fill", color: Color(red: 0.29, green: 0.33, blue: 0.39)) {
                    store.updateDeliveryStatus(id: delivery.id, status: .inTransit)
                }
            }
            if delivery.status == .inTransit {
                actionButton(title: "Marcar como Entregado", icon: "checkmark.circle.fill", color: Color(red: 0.22, green: 0.27, blue: 0.32)) {
                    if delivery.photos?.isEmpty != false {
                        // Photo required - show alert
                    } else {
                        store.updateDeliveryStatus(id: delivery.id, status: .delivered)
                    }
                }
            }
        }
    }

    // MARK: - Admin View
    private var adminView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header gradient
                adminHeader
                // Stats grid
                statsGrid
                // Revenue card
                revenueCard
                // Recent deliveries
                recentDeliveriesSection
            }
            .padding(.bottom, 24)
        }
    }

    private var adminHeader: some View {
        HStack {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white.opacity(0.18))
                        .frame(width: 52, height: 52)
                    if let logo = store.logo, let url = URL(string: logo) {
                        AsyncImage(url: url) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Image(systemName: "shippingbox.fill").foregroundStyle(.white).font(.system(size: 24))
                        }
                        .frame(width: 52, height: 52)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    } else {
                        Image(systemName: "shippingbox.fill").foregroundStyle(.white).font(.system(size: 24))
                    }
                    if isAdmin {
                        Button {
                            showLogoOptions = true
                        } label: {
                            ZStack {
                                Circle().fill(Color(red: 0.22, green: 0.27, blue: 0.32)).frame(width: 22, height: 22)
                                Image(systemName: "camera.fill").font(.system(size: 10)).foregroundStyle(.white)
                            }
                            .overlay(Circle().stroke(Color(red: 0.12, green: 0.16, blue: 0.22), lineWidth: 2))
                        }
                        .offset(x: 18, y: 18)
                    }
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hola 👋").font(.system(size: 16)).foregroundStyle(.white.opacity(0.9))
                    Text(store.companyName.isEmpty ? "Dashboard" : store.companyName)
                        .font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
                }
            }
            Spacer()
            ZStack {
                Circle().fill(Color.white.opacity(0.15)).frame(width: 44, height: 44)
                Image(systemName: "chart.line.uptrend.xyaxis").foregroundStyle(.white).font(.system(size: 20))
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .padding(.bottom, 32)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Color(red: 0.22, green: 0.27, blue: 0.32), Color(red: 0.12, green: 0.16, blue: 0.22)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
    }

    private var statsGrid: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Resumen General").font(.system(size: 18, weight: .bold)).foregroundStyle(.primary)
                Spacer()
                Text("Ver más").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color(red: 0.29, green: 0.33, blue: 0.39))
            }
            HStack(spacing: 12) {
                statCard(value: "\(myStats.total)", label: "Total Envíos", icon: "shippingbox.fill",
                         gradient: [Color(red: 0.42, green: 0.46, blue: 0.52), Color(red: 0.22, green: 0.27, blue: 0.32)])
                statCard(value: "\(myStats.pending)", label: "Pendientes", icon: "clock.fill",
                         gradient: [Color(red: 0.61, green: 0.64, blue: 0.69), Color(red: 0.42, green: 0.46, blue: 0.52)])
            }
            HStack(spacing: 12) {
                statCard(value: "\(myStats.inTransit)", label: "En Tránsito", icon: "truck.box.fill",
                         gradient: [Color(red: 0.42, green: 0.46, blue: 0.52), Color(red: 0.29, green: 0.33, blue: 0.39)])
                statCard(value: "\(myStats.delivered)", label: "Entregados", icon: "checkmark.circle.fill",
                         gradient: [Color(red: 0.22, green: 0.27, blue: 0.32), Color(red: 0.12, green: 0.16, blue: 0.22)])
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 0)
    }

    private func statCard(value: String, label: String, icon: String, gradient: [Color]) -> some View {
        VStack(spacing: 12) {
            ZStack {
                Circle().fill(Color.white.opacity(0.25)).frame(width: 48, height: 48)
                Image(systemName: icon).font(.system(size: 20)).foregroundStyle(.white)
            }
            Text(value).font(.system(size: 32, weight: .heavy)).foregroundStyle(.white)
            Text(label).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white.opacity(0.95))
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 140)
        .padding(20)
        .background(LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
    }

    private var revenueCard: some View {
        HStack {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.08)).frame(width: 56, height: 56)
                    Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 24)).foregroundStyle(Color(red: 0.82, green: 0.83, blue: 0.86))
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Ingresos Totales").font(.system(size: 13)).foregroundStyle(.white.opacity(0.7))
                    Text("Q \(myStats.totalRevenue, specifier: "%.2f")").font(.system(size: 28, weight: .heavy)).foregroundStyle(.white)
                    Text("+12% vs mes anterior").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color(red: 0.61, green: 0.64, blue: 0.69))
                }
            }
            Spacer()
            ZStack {
                Circle().fill(Color.white.opacity(0.1)).frame(width: 40, height: 40)
                Image(systemName: "arrow.right").font(.system(size: 20)).foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(24)
        .background(LinearGradient(colors: [Color(red: 0.12, green: 0.16, blue: 0.22), Color(red: 0.07, green: 0.09, blue: 0.15)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 4)
        .padding(.horizontal, 20)
    }

    private var recentDeliveriesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Envíos Recientes").font(.system(size: 20, weight: .bold)).foregroundStyle(.primary)
                    Text("\(recentDeliveries.count) entregas activas").font(.system(size: 13)).foregroundStyle(.secondary)
                }
                Spacer()
                HStack(spacing: 4) {
                    Text("Ver todos").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color(red: 0.29, green: 0.33, blue: 0.39))
                    Image(systemName: "arrow.right").font(.system(size: 14)).foregroundStyle(Color(red: 0.29, green: 0.33, blue: 0.39))
                }
            }
            if recentDeliveries.isEmpty {
                VStack(spacing: 16) {
                    ZStack {
                        Circle().fill(Color.gray.opacity(0.15)).frame(width: 80, height: 80)
                        Image(systemName: "shippingbox.fill").font(.system(size: 32)).foregroundStyle(Color(red: 0.42, green: 0.46, blue: 0.52))
                    }
                    Text("No hay envíos registrados").font(.system(size: 18, weight: .semibold)).foregroundStyle(.primary)
                    Text("Comienza creando tu primer envío").font(.system(size: 14)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(48)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
            } else {
                ForEach(recentDeliveries) { delivery in
                    recentDeliveryCard(delivery)
                }
            }
        }
        .padding(.horizontal, 20)
    }

    private func recentDeliveryCard(_ delivery: Delivery) -> some View {
        VStack(spacing: 12) {
            HStack {
                HStack(spacing: 12) {
                    Circle().fill(statusColor(delivery.status)).frame(width: 12, height: 12)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(delivery.receiver.name).font(.system(size: 16, weight: .bold)).foregroundStyle(.primary)
                        HStack(spacing: 4) {
                            Image(systemName: "mappin.and.ellipse").font(.system(size: 12)).foregroundStyle(.secondary)
                            Text(delivery.zone.label.uppercased()).font(.system(size: 12, weight: .medium)).foregroundStyle(.secondary)
                        }
                    }
                }
                Spacer()
                statusBadge(delivery.status)
            }
            Divider()
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "truck.box").font(.system(size: 14)).foregroundStyle(.secondary)
                    Text(delivery.messenger).font(.system(size: 13, weight: .medium)).foregroundStyle(.secondary)
                }
                Spacer()
                Text("Q \(delivery.total, specifier: "%.2f")")
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    // MARK: - Shared Helpers
    private func statusColor(_ status: DeliveryStatus) -> Color {
        switch status {
        case .pending: Color(red: 0.61, green: 0.64, blue: 0.69)
        case .inTransit: Color(red: 0.42, green: 0.46, blue: 0.52)
        case .delivered: Color(red: 0.22, green: 0.27, blue: 0.32)
        case .cancelled, .notDelivered: Color(red: 0.61, green: 0.64, blue: 0.69)
        case .rescheduled: Color(red: 0.42, green: 0.46, blue: 0.52)
        }
    }

    private func statusBadge(_ status: DeliveryStatus) -> some View {
        Text(status.label)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(.primary)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(badgeBgColor(status))
            )
    }

    private func badgeBgColor(_ status: DeliveryStatus) -> Color {
        switch status {
        case .pending: Color(red: 0.90, green: 0.91, blue: 0.92)
        case .inTransit: Color(red: 0.82, green: 0.84, blue: 0.86)
        case .delivered: Color(red: 0.61, green: 0.64, blue: 0.69)
        case .cancelled, .notDelivered: Color(red: 0.90, green: 0.91, blue: 0.92)
        case .rescheduled: Color(red: 0.82, green: 0.84, blue: 0.86)
        }
    }

    @ViewBuilder
    private func detailSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(.primary)
            content()
        }
    }

    private func detailRow(icon: String, text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(.secondary)
            Text(text).font(.system(size: 14)).foregroundStyle(.primary)
            Spacer()
        }
    }

    private func costRow(label: String, value: Double) -> some View {
        HStack {
            Text(label).font(.system(size: 14)).foregroundStyle(.secondary)
            Spacer()
            Text("Q \(value, specifier: "%.2f")").font(.system(size: 14, weight: .semibold)).foregroundStyle(.primary)
        }
    }

    private func actionButton(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 20))
                Text(title).font(.system(size: 16, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}
