import SwiftUI

struct NewPickupView: View {
    @Environment(AppStore.self) private var store
    @State private var storeName = ""
    @State private var address = ""
    @State private var phoneNumber = ""
    @State private var pickupOnly = false
    @State private var cost = ""
    @State private var selectedMessengerId: String?
    @State private var showAlert = false
    @State private var alertMessage = ""

    private var messengers: [MessengerInfo] { store.messengers }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Información de Recolección").font(.system(size: 18, weight: .bold))

                    labeledInput(label: "Nombre de la Tienda u Empresa", icon: "building.2.fill", text: $storeName, placeholder: "Ej: Tienda El Sol")
                    labeledTextArea(label: "Dirección", icon: "mappin.and.ellipse", text: $address, placeholder: "Ej: 5ta Avenida 10-20, Zona 1")

                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: "phone.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            Text("Número de Teléfono").font(.system(size: 14, weight: .semibold))
                        }
                        HStack(spacing: 8) {
                            Text("+502").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            TextField("Ej: 5555-5555", text: $phoneNumber)
                                .keyboardType(.phonePad)
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 48)
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: "dollarsign.circle.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            Text("Costo").font(.system(size: 14, weight: .semibold))
                        }
                        HStack(spacing: 8) {
                            Text("Q").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            TextField("0.00", text: $cost)
                                .keyboardType(.decimalPad)
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 48)
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    HStack {
                        HStack(spacing: 8) {
                            Image(systemName: "tray.full.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            Text("Solo Recoger").font(.system(size: 14, weight: .semibold))
                        }
                        Spacer()
                        Toggle("", isOn: $pickupOnly).tint(Color(red: 0.22, green: 0.27, blue: 0.32))
                    }
                    .padding(12)
                    .background(Color(.tertiarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: "person.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            Text("Asignar Mensajero").font(.system(size: 14, weight: .semibold))
                        }
                        if messengers.isEmpty {
                            Text("No hay mensajeros disponibles")
                                .font(.system(size: 14)).foregroundStyle(.secondary)
                                .padding(.vertical, 12)
                        } else {
                            VStack(spacing: 8) {
                                ForEach(messengers) { m in
                                    Button {
                                        selectedMessengerId = m.id
                                    } label: {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(m.name).font(.system(size: 15, weight: .semibold))
                                                    .foregroundStyle(selectedMessengerId == m.id ? .white : .primary)
                                                Text("+502 \(m.phone)").font(.system(size: 13))
                                                    .foregroundStyle(selectedMessengerId == m.id ? .white.opacity(0.8) : .secondary)
                                            }
                                            Spacer()
                                            if selectedMessengerId == m.id {
                                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
                                            }
                                        }
                                        .padding(14)
                                        .background(selectedMessengerId == m.id ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.systemBackground))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(.separator), lineWidth: selectedMessengerId == m.id ? 0 : 1))
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))

                Button {
                    handleSubmit()
                } label: {
                    Text("Agendar Recolección")
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
        .alert("Recolección", isPresented: $showAlert) {
            Button("OK") {}
        } message: { Text(alertMessage) }
    }

    private func labeledInput(label: String, icon: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                Text(label).font(.system(size: 14, weight: .semibold))
            }
            TextField(placeholder, text: text)
                .padding(12)
                .background(Color(.tertiarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func labeledTextArea(label: String, icon: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                Text(label).font(.system(size: 14, weight: .semibold))
            }
            TextEditor(text: text)
                .frame(minHeight: 80)
                .padding(8)
                .background(Color(.tertiarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    Group {
                        if text.wrappedValue.isEmpty {
                            Text(placeholder).foregroundStyle(.secondary).padding(.horizontal, 16).padding(.top, 12)
                        }
                    }, alignment: .topLeading)
        }
    }

    private func handleSubmit() {
        guard !storeName.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el nombre de la tienda"); return }
        guard !address.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa la dirección"); return }
        guard !phoneNumber.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Ingresa el número de teléfono"); return }
        guard let costVal = Double(cost), costVal > 0 else { alert("Ingresa un costo válido"); return }
        guard let messengerId = selectedMessengerId else { alert("Selecciona un mensajero"); return }

        let messenger = messengers.first { $0.id == messengerId }
        let now = ISO8601DateFormatter().string(from: Date())
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
        let pickup = Pickup(
            id: "\(Date().timeIntervalSince1970)",
            sender: Person(name: storeName.trimmingCharacters(in: .whitespaces), phone: phoneNumber.trimmingCharacters(in: .whitespaces), address: address.trimmingCharacters(in: .whitespaces)),
            messenger: messenger?.name ?? "Sin asignar",
            messengerId: messengerId,
            zone: .zona1,
            scheduledDate: now,
            scheduledTime: timeFormatter.string(from: Date()),
            status: .scheduled,
            createdAt: now, updatedAt: now,
            packageCount: 1,
            pickupOnly: pickupOnly,
            cost: costVal
        )
        store.addPickup(pickup)
        alert("Recolección agendada correctamente")
        storeName = ""; address = ""; phoneNumber = ""; cost = ""; selectedMessengerId = nil; pickupOnly = false
    }

    private func alert(_ msg: String) { alertMessage = msg; showAlert = true }
}
