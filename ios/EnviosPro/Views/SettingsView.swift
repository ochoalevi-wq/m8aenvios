import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @State private var editingCompanyName = ""
    @State private var editingWhatsappNumber = ""
    @State private var showAddUserSheet = false
    @State private var editingCredential: Credential?
    @State private var showAlert = false
    @State private var alertMessage = ""

    // Form state
    @State private var formUsername = ""
    @State private var formPassword = ""
    @State private var formRole: UserRole = .scheduler
    @State private var formFirstName = ""
    @State private var formLastName = ""
    @State private var formPhoneNumber = ""
    @State private var formAge = ""
    @State private var formLicenseType: LicenseType = .B
    @State private var formVehicleType: VehicleType = .moto

    private var isAdmin: Bool { store.currentUser?.role == .admin }
    private var isMessenger: Bool { store.currentUser?.role == .messenger }
    private var currentMessenger: MessengerInfo? {
        isMessenger ? store.messengers.first { $0.id == store.currentUser?.id } : nil
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // User header
                HStack(spacing: 16) {
                    ZStack {
                        Circle().fill(Color(red: 0.22, green: 0.27, blue: 0.32)).frame(width: 64, height: 64)
                        Image(systemName: "person.fill").font(.system(size: 28)).foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(store.currentUser?.name ?? "").font(.system(size: 20, weight: .bold))
                        Text(store.currentUser?.role.label ?? "").font(.system(size: 14)).foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(20)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // WhatsApp section (admin)
                if isAdmin {
                    settingsSection("WhatsApp de la Empresa", description: "Configura el número de WhatsApp para contacto directo") {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle().fill(Color.green.opacity(0.15)).frame(width: 48, height: 48)
                                Image(systemName: "message.fill").foregroundStyle(.green)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Número de WhatsApp").font(.system(size: 16, weight: .semibold))
                                Text(store.whatsappNumber.isEmpty ? "No configurado" : "+502 \(store.whatsappNumber)")
                                    .font(.system(size: 14)).foregroundStyle(.secondary)
                            }
                            Spacer()
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Número de Teléfono").font(.system(size: 14, weight: .semibold))
                            HStack(spacing: 8) {
                                Text("+502").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                                TextField("Ingresa el número", text: $editingWhatsappNumber)
                                    .keyboardType(.phonePad)
                            }
                            .padding(.horizontal, 12).frame(height: 48)
                            .background(Color(.tertiarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        Button {
                            store.updateWhatsappNumber(editingWhatsappNumber)
                            alert("Número de WhatsApp guardado")
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "message.fill")
                                Text("Guardar Número de WhatsApp")
                            }
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Color.green)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }

                // Company info (admin)
                if isAdmin {
                    settingsSection("Información de la Empresa", description: "Personaliza tu aplicación con el logo y nombre de tu empresa") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Nombre de la Empresa").font(.system(size: 14, weight: .semibold))
                            TextField("Ingresa el nombre de tu empresa", text: $editingCompanyName)
                                .padding(12)
                                .background(Color(.tertiarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        Button {
                            store.updateCompanyName(editingCompanyName)
                            alert("Nombre guardado correctamente")
                        } label: {
                            Text("Guardar Nombre")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 24).padding(.vertical, 12)
                                .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }

                        Text("Logo de la Empresa").font(.system(size: 16, weight: .semibold))
                            .padding(.top, 16)

                        VStack(spacing: 16) {
                            if let logo = store.logo, let url = URL(string: logo) {
                                AsyncImage(url: url) { image in
                                    image.resizable().scaledToFit()
                                } placeholder: {
                                    Color.gray.opacity(0.2)
                                }
                                .frame(width: 150, height: 150)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            } else {
                                VStack(spacing: 8) {
                                    Image(systemName: "photo.badge.plus").font(.system(size: 48)).foregroundStyle(.secondary)
                                    Text("Sin logo").font(.system(size: 14)).foregroundStyle(.secondary)
                                }
                                .frame(width: 150, height: 150)
                                .background(Color(.tertiarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16).strokeBorder(Color(.separator), style: StrokeStyle(lineWidth: 2, dash: [8]))
                                )
                            }
                        }
                        .frame(maxWidth: .infinity)

                        Button {
                            // Photo picker would go here - simulator placeholder
                            alert("Instala esta app en tu dispositivo para cambiar el logo.")
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "photo.badge.plus")
                                Text(store.logo == nil ? "Cargar Logo" : "Cambiar Logo")
                            }
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 16)
                            .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        if store.logo != nil {
                            Button {
                                store.updateLogo(nil)
                                alert("Logo eliminado")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "trash.fill")
                                    Text("Eliminar Logo")
                                }
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity).padding(.vertical, 14)
                                .background(Color.red.opacity(0.1))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }

                        Text("El logo se mostrará en el encabezado de la aplicación. Se recomienda usar una imagen cuadrada con fondo transparente.")
                            .font(.system(size: 13)).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }

                // Availability toggle (messenger)
                if isMessenger, let cm = currentMessenger {
                    VStack(spacing: 16) {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle().fill(Color.blue.opacity(0.15)).frame(width: 56, height: 56)
                                Image(systemName: "person.fill.checkmark").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Estado de Disponibilidad").font(.system(size: 18, weight: .bold))
                                Text(cm.isAvailable ? "Estás disponible para recibir asignaciones" : "No estás disponible para recibir asignaciones")
                                    .font(.system(size: 13)).foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                        Toggle("", isOn: Binding(
                            get: { cm.isAvailable },
                            set: { _ in store.toggleAvailability(messengerId: cm.id) }
                        ))
                        .tint(Color.green)

                        HStack(spacing: 8) {
                            Circle().fill(cm.isAvailable ? Color.green : Color.secondary).frame(width: 10, height: 10)
                            Text(cm.isAvailable ? "Disponible" : "No Disponible")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(cm.isAvailable ? .green : .secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(cm.isAvailable ? Color.green.opacity(0.1) : Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(20)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal, 20)
                }

                // User management (admin)
                if isAdmin {
                    VStack(spacing: 16) {
                        HStack {
                            Text("Gestión de Usuarios").font(.system(size: 18, weight: .bold))
                            Spacer()
                            Button {
                                openAddModal()
                            } label: {
                                Image(systemName: "plus")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 36, height: 36)
                                    .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                                    .clipShape(Circle())
                            }
                        }
                        Text("Agrega usuarios con contraseña para mensajeros y personal que agenda envíos")
                            .font(.system(size: 14)).foregroundStyle(.secondary)

                        if store.credentials.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "shield.lefthalf.filled").font(.system(size: 48)).foregroundStyle(.secondary)
                                Text("No hay usuarios registrados").font(.system(size: 16, weight: .semibold))
                                Text("Agrega el primer usuario para comenzar").font(.system(size: 14)).foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 48)
                        } else {
                            VStack(spacing: 12) {
                                ForEach(store.credentials) { cred in
                                    credentialCard(cred)
                                }
                            }
                        }
                    }
                    .padding(20)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
            .padding(.bottom, 40)
        }
        .background(Color(.systemBackground))
        .onAppear {
            editingCompanyName = store.companyName
            editingWhatsappNumber = store.whatsappNumber
        }
        .sheet(isPresented: $showAddUserSheet) {
            userFormSheet
        }
        .alert("Ajustes", isPresented: $showAlert) {
            Button("OK") {}
        } message: { Text(alertMessage) }
    }

    @ViewBuilder
    private func settingsSection<Content: View>(_ title: String, description: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title).font(.system(size: 18, weight: .bold))
                Text(description).font(.system(size: 14)).foregroundStyle(.secondary)
            }
            content()
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func credentialCard(_ cred: Credential) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(Color(.tertiarySystemBackground)).frame(width: 48, height: 48)
                Image(systemName: cred.role == .admin ? "shield.fill" : cred.role == .messenger ? "person.fill" : "calendar")
                    .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(cred.fullName).font(.system(size: 16, weight: .semibold))
                Text(cred.role.label).font(.system(size: 14)).foregroundStyle(.secondary)
                if !cred.phoneNumber.isEmpty {
                    Text(cred.phoneNumber).font(.system(size: 13)).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(spacing: 8) {
                Button {
                    openEditModal(cred)
                } label: {
                    Image(systemName: "pencil").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .frame(width: 36, height: 36)
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                if cred.id != store.currentUser?.id {
                    Button {
                        store.deleteCredential(id: cred.id)
                        alert("Usuario eliminado correctamente")
                    } label: {
                        Image(systemName: "trash.fill").foregroundStyle(.red)
                            .frame(width: 36, height: 36)
                            .background(Color(.tertiarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
        .padding(16)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(.separator), lineWidth: 1))
    }

    // MARK: - User Form Sheet
    private var userFormSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text(editingCredential == nil ? "Agregar Usuario" : "Editar Usuario")
                        .font(.system(size: 20, weight: .bold))

                    formField("Nombre", text: $formFirstName, placeholder: "Ingresa el nombre")
                    formField("Apellido", text: $formLastName, placeholder: "Ingresa el apellido")

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Número de Teléfono").font(.system(size: 14, weight: .semibold))
                        HStack(spacing: 8) {
                            Text("+502").font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                            TextField("Ingresa el número", text: $formPhoneNumber)
                                .keyboardType(.phonePad)
                        }
                        .padding(.horizontal, 12).frame(height: 48)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    formField("Nombre de Usuario", text: $formUsername, placeholder: "Mínimo 3 caracteres")
                    formField("Contraseña", text: $formPassword, placeholder: "Mínimo 4 caracteres", secure: true)

                    if formRole == .messenger {
                        formField("Edad", text: $formAge, placeholder: "Ingresa la edad", keyboardType: .numberPad)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Tipo de Licencia").font(.system(size: 14, weight: .semibold))
                            HStack(spacing: 8) {
                                ForEach(LicenseType.allCases, id: \.self) { type in
                                    Button { formLicenseType = type } label: {
                                        HStack(spacing: 4) {
                                            Image(systemName: "creditcard.fill").font(.system(size: 14))
                                            Text("Tipo \(type.rawValue)").font(.system(size: 13, weight: .medium))
                                        }
                                        .foregroundStyle(formLicenseType == type ? .white : .primary)
                                        .padding(.horizontal, 12).padding(.vertical, 10)
                                        .background(formLicenseType == type ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                    }
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Tipo de Vehículo").font(.system(size: 14, weight: .semibold))
                            VStack(spacing: 8) {
                                ForEach(VehicleType.allCases, id: \.self) { type in
                                    Button { formVehicleType = type } label: {
                                        HStack(spacing: 8) {
                                            Image(systemName: "car.fill")
                                            Text(type.label).font(.system(size: 14, weight: .medium))
                                            Spacer()
                                            if formVehicleType == type {
                                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
                                            }
                                        }
                                        .foregroundStyle(formVehicleType == type ? .white : .primary)
                                        .padding(.horizontal, 14).padding(.vertical, 12)
                                        .background(formVehicleType == type ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                    }
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Rol del Usuario").font(.system(size: 14, weight: .semibold))
                        VStack(spacing: 8) {
                            ForEach(UserRole.allCases, id: \.self) { role in
                                Button { formRole = role } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: role == .admin ? "shield.fill" : role == .messenger ? "person.fill" : "calendar")
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(role.label).font(.system(size: 15, weight: .bold))
                                            Text(role == .admin ? "Acceso completo" : role == .messenger ? "Gestiona entregas" : "Crea envíos")
                                                .font(.system(size: 11)).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        if formRole == role {
                                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.white)
                                        }
                                    }
                                    .foregroundStyle(formRole == role ? .white : .primary)
                                    .padding(16)
                                    .background(formRole == role ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                            }
                        }
                    }

                    Button { handleSaveCredential() } label: {
                        Text("Guardar")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 16)
                            .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.bottom, 24)
                }
                .padding(20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { showAddUserSheet = false }
                }
            }
        }
    }

    private func formField(_ title: String, text: Binding<String>, placeholder: String, secure: Bool = false, keyboardType: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 14, weight: .semibold))
            Group {
                if secure {
                    SecureField(placeholder, text: text).textInputAutocapitalization(.never)
                } else {
                    TextField(placeholder, text: text).keyboardType(keyboardType).textInputAutocapitalization(keyboardType == .numberPad ? .never : .sentences)
                }
            }
            .padding(12)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func openAddModal() {
        editingCredential = nil
        formUsername = ""; formPassword = ""; formRole = .scheduler
        formFirstName = ""; formLastName = ""; formPhoneNumber = ""
        formAge = ""; formLicenseType = .B; formVehicleType = .moto
        showAddUserSheet = true
    }

    private func openEditModal(_ cred: Credential) {
        editingCredential = cred
        formUsername = cred.username; formPassword = cred.password; formRole = cred.role
        formFirstName = cred.firstName; formLastName = cred.lastName; formPhoneNumber = cred.phoneNumber
        formAge = cred.age.map { String($0) } ?? ""
        formLicenseType = cred.licenseType ?? .B
        formVehicleType = cred.vehicleType ?? .moto
        showAddUserSheet = true
    }

    private func handleSaveCredential() {
        guard !formUsername.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Completa todos los campos"); return }
        guard !formPassword.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Completa todos los campos"); return }
        guard !formFirstName.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Completa todos los campos"); return }
        guard !formLastName.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Completa todos los campos"); return }
        guard !formPhoneNumber.trimmingCharacters(in: .whitespaces).isEmpty else { alert("Completa todos los campos"); return }

        let age = Int(formAge.trimmingCharacters(in: .whitespaces))
        let lic = formRole == .messenger ? formLicenseType : nil
        let veh = formRole == .messenger ? formVehicleType : nil

        if let editing = editingCredential {
            var updated = editing
            updated.username = formUsername.trimmingCharacters(in: .whitespaces)
            updated.password = formPassword.trimmingCharacters(in: .whitespaces)
            updated.role = formRole
            updated.firstName = formFirstName.trimmingCharacters(in: .whitespaces)
            updated.lastName = formLastName.trimmingCharacters(in: .whitespaces)
            updated.phoneNumber = formPhoneNumber.trimmingCharacters(in: .whitespaces)
            updated.age = age
            updated.licenseType = lic
            updated.vehicleType = veh
            store.updateCredential(updated)
            alert("Usuario actualizado correctamente")
        } else {
            let cred = Credential(
                id: "\(Date().timeIntervalSince1970)",
                username: formUsername.trimmingCharacters(in: .whitespaces),
                password: formPassword.trimmingCharacters(in: .whitespaces),
                role: formRole,
                firstName: formFirstName.trimmingCharacters(in: .whitespaces),
                lastName: formLastName.trimmingCharacters(in: .whitespaces),
                phoneNumber: formPhoneNumber.trimmingCharacters(in: .whitespaces),
                createdAt: ISO8601DateFormatter().string(from: Date()),
                age: age, licenseType: lic, vehicleType: veh
            )
            store.addCredential(cred)
            alert("Usuario agregado correctamente")
        }
        showAddUserSheet = false
    }

    private func alert(_ msg: String) { alertMessage = msg; showAlert = true }
}
