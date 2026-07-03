import SwiftUI

struct PickupsView: View {
    @Environment(AppStore.self) private var store
    @State private var searchText = ""
    @State private var showFilters = false
    @State private var statusFilter: PickupStatus?
    @State private var zoneFilter: Zone?
    @State private var showMessengersList = false

    private var isMessenger: Bool { store.currentUser?.role == .messenger }
    private var messengers: [MessengerInfo] { store.messengers }

    private var pickups: [Pickup] {
        store.filteredPickups(
            status: statusFilter, zone: zoneFilter, search: searchText,
            messengerId: isMessenger ? store.currentUser?.id : nil
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            if !isMessenger {
                HStack(spacing: 12) {
                    NavigationLink {
                        NewPickupView()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "tray.full.fill")
                            Text("Nueva Recolección")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    Button { showMessengersList.toggle() } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "person.2.fill")
                            Text("Mensajeros")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 0.22, green: 0.27, blue: 0.32), lineWidth: 2))
                    }
                }
                .padding(16)
            }

            if showMessengersList && !isMessenger {
                ScrollView {
                    VStack(spacing: 12) {
                        Text("Lista de Mensajeros").font(.system(size: 18, weight: .bold)).frame(maxWidth: .infinity, alignment: .leading)
                        if messengers.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "person.2").font(.system(size: 48)).foregroundStyle(.secondary)
                                Text("No hay mensajeros registrados").font(.system(size: 16, weight: .semibold))
                            }
                            .padding(.vertical, 40)
                        } else {
                            ForEach(messengers) { m in
                                HStack {
                                    HStack(spacing: 12) {
                                        ZStack {
                                            Circle().fill(Color.blue.opacity(0.15)).frame(width: 48, height: 48)
                                            Image(systemName: "person.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                                        }
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(m.name).font(.system(size: 16, weight: .semibold))
                                            Text(m.phone).font(.system(size: 14)).foregroundStyle(.secondary)
                                        }
                                    }
                                    Spacer()
                                }
                                .padding(12)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                    .padding(16)
                }
            }

            // Search bar
            HStack(spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                    TextField("Buscar por nombre o mensajero...", text: $searchText)
                        .textInputAutocapitalization(.never)
                }
                .padding(.horizontal, 12)
                .frame(height: 44)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                Button { showFilters.toggle() } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(showFilters ? Color(red: 0.22, green: 0.27, blue: 0.32) : .secondary)
                        .frame(width: 44, height: 44)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding(16)

            if showFilters {
                VStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Estado:").font(.system(size: 14, weight: .semibold))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                chip("Todos", active: statusFilter == nil) { statusFilter = nil }
                                ForEach(PickupStatus.allCases, id: \.self) { s in
                                    chip(s.label, active: statusFilter == s) { statusFilter = s }
                                }
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Zona:").font(.system(size: 14, weight: .semibold))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                chip("Todas", active: zoneFilter == nil) { zoneFilter = nil }
                                ForEach(Zone.allCases, id: \.self) { z in
                                    chip(z.label, active: zoneFilter == z) { zoneFilter = z }
                                }
                            }
                        }
                    }
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
            }

            ScrollView {
                VStack(spacing: 16) {
                    if pickups.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "tray.full").font(.system(size: 64)).foregroundStyle(.secondary)
                            Text("No se encontraron recolecciones").font(.system(size: 18, weight: .semibold))
                            Text("Agenda tu primera recolección para comenzar")
                                .font(.system(size: 14)).foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 60)
                    } else {
                        ForEach(pickups) { pickup in
                            pickupCard(pickup)
                        }
                    }
                }
                .padding(16)
            }
        }
        .background(Color(.systemBackground))
    }

    private func chip(_ text: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(active ? .white : .primary)
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(active ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.tertiarySystemBackground))
                .clipShape(Capsule())
        }
    }

    private func pickupCard(_ pickup: Pickup) -> some View {
        VStack(spacing: 16) {
            HStack {
                HStack(spacing: 12) {
                    Text("#\(pickup.shortId)").font(.system(size: 14, weight: .semibold)).foregroundStyle(.secondary)
                    Text(pickup.status.label)
                        .font(.system(size: 12, weight: .semibold))
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(statusBg(pickup.status))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                Spacer()
                Text(pickup.zone.label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Image(systemName: "person.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    Text(pickup.sender.name).font(.system(size: 16, weight: .semibold))
                }
                HStack(spacing: 8) {
                    Image(systemName: "phone.fill").foregroundStyle(.secondary)
                    Text(pickup.sender.phone).font(.system(size: 13)).foregroundStyle(.secondary)
                }
                HStack(spacing: 8) {
                    Image(systemName: "mappin.and.ellipse").foregroundStyle(.secondary)
                    Text(pickup.sender.address).font(.system(size: 13)).foregroundStyle(.secondary)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(spacing: 8) {
                HStack(spacing: 10) {
                    Image(systemName: "calendar").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    Text(formatDate(pickup.scheduledDate)).font(.system(size: 14, weight: .medium))
                }
                HStack(spacing: 10) {
                    Image(systemName: "clock.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    Text(pickup.scheduledTime).font(.system(size: 14, weight: .medium))
                }
                HStack(spacing: 10) {
                    Image(systemName: "shippingbox.fill").foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                    Text("\(pickup.packageCount) \(pickup.packageCount == 1 ? "paquete" : "paquetes")").font(.system(size: 14, weight: .medium))
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.blue.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mensajero:").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(pickup.messenger).font(.system(size: 14, weight: .semibold))
                }
                Spacer()
            }
            .padding(.top, 16)
            .overlay(alignment: .top) { Divider() }

            if let notes = pickup.notes, !notes.isEmpty {
                HStack {
                    Image(systemName: "note.text").foregroundStyle(.orange)
                    Text(notes).font(.system(size: 13))
                    Spacer()
                }
                .padding(12)
                .background(Color.orange.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            if isMessenger && pickup.status == .scheduled {
                Button {
                    store.updatePickupStatus(id: pickup.id, status: .collected)
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Marcar como Recolectado")
                    }
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.green)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            if isMessenger && pickup.status == .collected {
                HStack(spacing: 10) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                    Text("Recolección Completada").font(.system(size: 16, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.green.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 2)
    }

    private func statusBg(_ status: PickupStatus) -> Color {
        switch status {
        case .scheduled: Color.blue.opacity(0.15)
        case .collected: Color.green.opacity(0.15)
        case .cancelled: Color.red.opacity(0.15)
        }
    }

    private func formatDate(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        guard let d = f.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.locale = Locale(identifier: "es_GT")
        df.dateFormat = "EEEE, d 'de' MMMM 'de' yyyy"
        return df.string(from: d)
    }
}
