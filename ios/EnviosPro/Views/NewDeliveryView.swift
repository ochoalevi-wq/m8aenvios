import SwiftUI

struct NewDeliveryView: View {
    @Environment(AppStore.self) private var store
    @State private var senderName = ""
    @State private var senderPhone = ""
    @State private var senderAddress = ""
    @State private var receiverName = ""
    @State private var receiverPhone = ""
    @State private var receiverAddress = ""
    @State private var selectedZone: Zone = .zona1
    @State private var packageCost = ""
    @State private var description = ""
    @State private var selectedMessengerId: String?
    @State private var showAlert = false
    @State private var alertMessage = ""

    private var messengers: [MessengerInfo] { store.messengers }
    private var shippingCost: Double { selectedZone.shippingCost }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Sender section
                formSection("Remitente") {
                    formInput(label: "Nombre", text: $senderName, icon: "person.fill")
                    phoneInput(label: "Teléfono", text: $senderPhone)
                    formInput(label: "Dirección", text: $senderAddress, icon: "mappin.and.ellipse")
                }

                // Receiver section
                formSection("Destinatario") {
                    formInput(label: "Nombre", text: $receiverName, icon: "person.fill")
                    phoneInput(label: "Teléfono", text: $receiverPhone)
                    formInput(label: "Dirección", text: $receiverAddress, icon: "mappin.and.ellipse")
                }

                // Zone & cost
                formSection("Información de Envío") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Zona").font(.system(size: 14, weight: .semibold))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Zone.allCases, id: \.self) { zone in
                                    Button {
                                        selectedZone = zone
                                    } label: {
                                        Text(zone.label)
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundStyle(selectedZone == zone ? .white : .primary)
                                            .padding(.horizontal, 16).padding(.vertical, 8)
                                            .background(selectedZone == zone ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.tertiarySystemBackground))
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Costo del Paquete (Q)").font(.system(size: 14, weight: .semibold))
                        HStack {
                            Text("Q").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            TextField("0.00", text: $packageCost)
                                .keyboardType(.decimalPad)
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 48)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Costo de Envío").font(.system(size: 14, weight: .semibold))
                        Text("Q \(shippingCost, specifier: "%.2f")")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Descripción (Opcional)").font(.system(size: 14, weight: .semibold))
                        TextEditor(text: $description)
                            .frame(minHeight: 80)
                            .padding(8)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }

                // Messenger assignment
                formSection("Asignar Mensajero") {
                    if messengers.isEmpty {
                        Text("No hay mensajeros disponibles")
                            .font(.system(size: 14)).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 24)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(messengers) { messenger in
                                Button {
                                    selectedMessengerId = messenger.id
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(messenger.name).font(.system(size: 15, weight: .semibold))
                                                .foregroundStyle(selectedMessengerId == messenger.id ? .white : .primary)
                                            Text("+502 \(messenger.phone)").font(.system(size: 13))
                                                .foregroundStyle(selectedMessengerId == messenger.id ? .white.opacity(0.8) : .secondary)
                                        }
                                        Spacer()
                                        if selectedMessengerId == messenger.id {
                                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
                                        }
                                    }
                                    .padding(14)
                                    .background(selectedMessengerId == messenger.id ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                    }
                }

                Button {
                    handleSubmit()
                } label: {
                    Text("Crear Envío")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.bottom, 32)
            }
            .padding(16)
        }
        .background(Color(.systemBackground))
        .alert("Envío", isPresented: $showAlert) {
            Button("OK") {}
        } message: { Text(alertMessage) }
    }

    @ViewBuilder
    private func formSection<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title).font(.system(size: 18, weight: .bold))
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func formInput(label: String, text: Binding<String>, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.system(size: 14, weight: .semibold))
            HStack(spacing: 8) {
                Image(systemName: icon).foregroundStyle(.secondary)
                TextField("", text: text).textInputAutocapitalization(.never)
            }
            .padding(.horizontal, 12)
            .frame(height: 48)
            .background(Color(.tertiarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func phoneInput(label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.system(size: 14, weight: .semibold))
            HStack(spacing: 8) {
                Text("+502").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                TextField("12345678", text: text)
                    .keyboardType(.phonePad)
            }
            .padding(.horizontal, 12)
            .frame(height: 48)
            .background(Color(.tertiarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func handleSubmit() {
        guard !senderName.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el nombre del remitente"); return }
        guard !senderPhone.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el teléfono del remitente"); return }
        guard !receiverName.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el nombre del destinatario"); return }
        guard !receiverPhone.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el teléfono del destinatario"); return }
        guard let cost = Double(packageCost), cost > 0 else { alert("Ingresa un costo válido"); return }
        guard let messengerId = selectedMessengerId else { alert("Selecciona un mensajero"); return }

        let messenger = messengers.first { $0.id == messengerId }
        let now = ISO8601DateFormatter().string(from: Date())
        let delivery = Delivery(
            id: "\(Date().timeIntervalSince1970)",
            sender: Person(name: senderName.trimmingCharacters(in: .whitespaces), phone: senderPhone.trimmingCharacters(in: .whitespaces), address: senderAddress.trimmingCharacters(in: .whitespaces)),
            receiver: Person(name: receiverName.trimmingCharacters(in: .whitespaces), phone: receiverPhone.trimmingCharacters(in: .whitespaces), address: receiverAddress.trimmingCharacters(in: .whitespaces)),
            messenger: messenger?.name ?? "Sin asignar",
            messengerId: messengerId,
            zone: selectedZone,
            packageCost: cost,
            shippingCost: shippingCost,
            status: .pending,
            createdAt: now, updatedAt: now,
            description: description.isEmpty ? nil : description
        )
        store.addDelivery(delivery)
        alert("Envío creado correctamente")
        clearForm()
    }

    private func clearForm() {
        senderName = ""; senderPhone = ""; senderAddress = ""
        receiverName = ""; receiverPhone = ""; receiverAddress = ""
        selectedZone = .zona1; packageCost = ""; description = ""
        selectedMessengerId = nil
    }

    private func alert(_ msg: String) {
        alertMessage = msg
        showAlert = true
    }
}
