import SwiftUI

struct RegisterView: View {
    @Environment(AppStore.self) private var store
    @State private var username = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var dismiss = false

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(Color.gray.opacity(0.12))
                            .frame(width: 96, height: 96)
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 44))
                            .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    }
                    Text("Crear Cuenta")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(.primary)
                    Text("Registra la primera cuenta de administrador")
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)

                HStack(spacing: 12) {
                    Image(systemName: "shippingbox.fill")
                        .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    Text("Como administrador podrás gestionar usuarios, asignar roles y controlar todo el sistema de envíos.")
                        .font(.system(size: 14))
                        .foregroundStyle(.primary)
                }
                .padding(16)
                .background(Color.gray.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
                .padding(.horizontal, 24)

                VStack(spacing: 24) {
                    inputField(title: "Nombre de Usuario", text: $username, icon: "person", placeholder: "Ingresa tu nombre de usuario")
                    SecureFieldInput(title: "Contraseña", text: $password, placeholder: "Mínimo 6 caracteres")
                    SecureFieldInput(title: "Confirmar Contraseña", text: $confirmPassword, placeholder: "Repite tu contraseña")

                    Button {
                        handleRegister()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "person.badge.plus")
                            Text(isLoading ? "Creando cuenta..." : "Crear Cuenta de Administrador")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .opacity(canRegister ? 1.0 : 0.5)
                    }
                    .disabled(!canRegister)
                }
                .padding(.horizontal, 24)
            }
            .padding(.vertical, 32)
        }
        .scrollContentBackground(.hidden)
        .background(Color(.systemBackground))
        .navigationTitle("Registrar")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Registro", isPresented: $showAlert) {
            Button("Continuar") { dismiss = true }
        } message: {
            Text(alertMessage)
        }
    }

    private var canRegister: Bool {
        !username.trimmingCharacters(in: .whitespaces).isEmpty &&
        !password.trimmingCharacters(in: .whitespaces).isEmpty &&
        !confirmPassword.trimmingCharacters(in: .whitespaces).isEmpty &&
        !isLoading
    }

    private func handleRegister() {
        if password.count < 6 {
            alertMessage = "La contraseña debe tener al menos 6 caracteres"
            showAlert = true
            return
        }
        if password != confirmPassword {
            alertMessage = "Las contraseñas no coinciden"
            showAlert = true
            return
        }
        isLoading = true
        do {
            try store.register(username: username.trimmingCharacters(in: .whitespaces),
                               password: password.trimmingCharacters(in: .whitespaces))
            alertMessage = "Tu cuenta de administrador ha sido creada correctamente"
            showAlert = true
        } catch {
            alertMessage = error.localizedDescription
            showAlert = true
        }
        isLoading = false
    }

    @ViewBuilder
    private func inputField(title: String, text: Binding<String>, icon: String, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.primary)
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundStyle(.secondary)
                TextField(placeholder, text: text)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 16)
            .frame(height: 56)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.separator), lineWidth: 1)
            )
        }
    }
}

private struct SecureFieldInput: View {
    let title: String
    @Binding var text: String
    let placeholder: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.primary)
            HStack(spacing: 12) {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.secondary)
                SecureField(placeholder, text: $text)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 16)
            .frame(height: 56)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.separator), lineWidth: 1)
            )
        }
    }
}
