import SwiftUI

struct LoginView: View {
    @Environment(AppStore.self) private var store
    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var showRegister = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(Color.gray.opacity(0.12))
                                .frame(width: 96, height: 96)
                            Image(systemName: "shippingbox.fill")
                                .font(.system(size: 44))
                                .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                        }
                        Text("Sistema de Envíos")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.primary)
                        Text("Inicia sesión para continuar")
                            .font(.system(size: 16))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 20)

                    // Form
                    VStack(spacing: 24) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Usuario")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.primary)
                            HStack(spacing: 12) {
                                Image(systemName: "person.text.rectangle")
                                    .foregroundStyle(.secondary)
                                TextField("Ingresa tu usuario", text: $username)
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

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Contraseña")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.primary)
                            HStack(spacing: 12) {
                                Image(systemName: "lock.fill")
                                    .foregroundStyle(.secondary)
                                SecureField("Ingresa tu contraseña", text: $password)
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

                        Button {
                            handleLogin()
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.right.square.fill")
                                Text(isLoading ? "Iniciando..." : "Iniciar Sesión")
                            }
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 56)
                            .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .opacity(canLogin ? 1.0 : 0.5)
                        }
                        .disabled(!canLogin)

                        if !store.hasAdminRegistered {
                            VStack(spacing: 16) {
                                HStack {
                                    Rectangle().fill(Color(.separator)).frame(height: 1)
                                    Text("o").font(.system(size: 14)).foregroundStyle(.secondary)
                                    Rectangle().fill(Color(.separator)).frame(height: 1)
                                }

                                NavigationLink {
                                    RegisterView()
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "person.badge.plus")
                                        Text("Crear Cuenta de Administrador")
                                    }
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                                    .frame(maxWidth: .infinity, minHeight: 56)
                                    .background(Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(red: 0.22, green: 0.27, blue: 0.32), lineWidth: 2)
                                    )
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.vertical, 32)
            }
            .scrollContentBackground(.hidden)
            .background(Color(.systemBackground))
            .alert("Error", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage)
            }
        }
    }

    private var canLogin: Bool {
        !username.trimmingCharacters(in: .whitespaces).isEmpty &&
        !password.trimmingCharacters(in: .whitespaces).isEmpty &&
        !isLoading
    }

    private func handleLogin() {
        isLoading = true
        do {
            try store.login(username: username.trimmingCharacters(in: .whitespaces),
                            password: password.trimmingCharacters(in: .whitespaces))
        } catch {
            alertMessage = error.localizedDescription
            showAlert = true
        }
        isLoading = false
    }
}

#Preview {
    LoginView()
        .environment(AppStore())
}
