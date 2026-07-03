import SwiftUI

enum AppScreen: String, CaseIterable, Hashable {
    case dashboard
    case deliveries
    case newDelivery
    case pickups
    case messengers
    case control
    case settings

    var title: String {
        switch self {
        case .dashboard: "Dashboard"
        case .deliveries: "Todos los Envíos"
        case .newDelivery: "Crear Envío"
        case .pickups: "Recolecciones"
        case .messengers: "Gestión de Mensajeros"
        case .control: "Control y Estadísticas"
        case .settings: "Configuración"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: "house.fill"
        case .deliveries: "shippingbox.fill"
        case .newDelivery: "plus.circle.fill"
        case .pickups: "tray.full.fill"
        case .messengers: "person.2.fill"
        case .control: "chart.bar.fill"
        case .settings: "gearshape.fill"
        }
    }
}

struct MainView: View {
    @Environment(AppStore.self) private var store
    @State private var path = NavigationPath()
    @State private var showDrawer = false
    @State private var selectedScreen: AppScreen = .dashboard

    private var isMessenger: Bool { store.currentUser?.role == .messenger }

    private var menuItems: [AppScreen] {
        if isMessenger {
            return [.dashboard, .pickups, .messengers, .settings]
        }
        return AppScreen.allCases
    }

    var body: some View {
        NavigationStack(path: $path) {
            screenContent
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            showDrawer = true
                        } label: {
                            Image(systemName: "line.3.horizontal")
                                .font(.system(size: 22))
                                .foregroundStyle(.primary)
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        if let logo = store.logo, let url = URL(string: logo) {
                            AsyncImage(url: url) { image in
                                image.resizable().scaledToFill()
                            } placeholder: {
                                Color.gray.opacity(0.2)
                            }
                            .frame(width: 32, height: 32)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(Color(.systemBackground), for: .navigationBar)
        }
        .overlay {
            if showDrawer {
                DrawerMenu(showDrawer: $showDrawer, selectedScreen: $selectedScreen, path: $path)
            }
        }
    }

    @ViewBuilder
    private var screenContent: some View {
        switch selectedScreen {
        case .dashboard:
            DashboardView()
                .navigationTitle(isMessenger ? "Mis Entregas" : "Dashboard")
        case .deliveries:
            DeliveriesView()
                .navigationTitle("Todos los Envíos")
        case .newDelivery:
            NewDeliveryView()
                .navigationTitle("Crear Envío")
        case .pickups:
            PickupsView()
                .navigationTitle("Recolecciones")
        case .messengers:
            MessengersView()
                .navigationTitle("Gestión de Mensajeros")
        case .control:
            ControlView()
                .navigationTitle("Control y Estadísticas")
        case .settings:
            SettingsView()
                .navigationTitle("Configuración")
        }
    }
}

private struct DrawerMenu: View {
    @Environment(AppStore.self) private var store
    @Binding var showDrawer: Bool
    @Binding var selectedScreen: AppScreen
    @Binding var path: NavigationPath
    @State private var offsetX: CGFloat = -300

    private var isMessenger: Bool { store.currentUser?.role == .messenger }

    var body: some View {
        ZStack(alignment: .leading) {
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture { closeDrawer() }

            VStack(spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    if let logo = store.logo, let url = URL(string: logo) {
                        AsyncImage(url: url) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Color.white.opacity(0.2)
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    Text("Menú")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(.white)
                    Text(store.currentUser?.name ?? "")
                        .font(.system(size: 16))
                        .foregroundStyle(.white.opacity(0.9))
                    Text(store.currentUser?.role.label ?? "")
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(24)
                .padding(.top, 20)
                .background(Color(red: 0.22, green: 0.27, blue: 0.32))

                // Menu items
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(menuItems, id: \.self) { item in
                            Button {
                                selectedScreen = item
                                closeDrawer()
                            } label: {
                                HStack(spacing: 16) {
                                    Image(systemName: item.icon)
                                        .font(.system(size: 20))
                                        .frame(width: 24)
                                    Text(isMessenger && item == .dashboard ? "Mis Entregas" : item.title)
                                        .font(.system(size: 16, weight: .semibold))
                                    Spacer()
                                }
                                .foregroundStyle(.primary)
                                .padding(.vertical, 16)
                                .padding(.horizontal, 24)
                                .background(selectedScreen == item ? Color.gray.opacity(0.1) : Color.clear)
                            }
                        }
                    }
                }

                // Logout
                VStack {
                    Divider()
                    Button {
                        store.logout()
                        showDrawer = false
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: 20))
                            Text("Cerrar Sesión")
                                .font(.system(size: 16, weight: .semibold))
                            Spacer()
                        }
                        .foregroundStyle(.red)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 8)
            }
            .frame(maxWidth: 300)
            .frame(maxHeight: .infinity)
            .background(Color(.systemBackground))
            .shadow(color: .black.opacity(0.2), radius: 10, x: 2)
            .offset(x: offsetX)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.3)) { offsetX = 0 }
        }
    }

    private var menuItems: [AppScreen] {
        if isMessenger {
            return [.dashboard, .pickups, .messengers, .settings]
        }
        return AppScreen.allCases
    }

    private func closeDrawer() {
        withAnimation(.easeIn(duration: 0.25)) { offsetX = -300 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            showDrawer = false
        }
    }
}
