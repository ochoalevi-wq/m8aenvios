import SwiftUI

struct DeliveriesView: View {
    @Environment(AppStore.self) private var store
    @State private var searchText = ""
    @State private var showFilters = false
    @State private var statusFilter: DeliveryStatus?
    @State private var zoneFilter: Zone?
    @State private var showNotDeliveredModal = false
    @State private var showRescheduleModal = false
    @State private var selectedDelivery: Delivery?
    @State private var notDeliveredReason = ""

    private var isMessenger: Bool { store.currentUser?.role == .messenger }
    private var canAssign: Bool { store.currentUser?.role == .admin || store.currentUser?.role == .scheduler }

    private var deliveries: [Delivery] {
        store.filteredDeliveries(
            status: statusFilter, zone: zoneFilter, search: searchText,
            messengerId: isMessenger ? store.currentUser?.id : nil
        )
    }

    var body: some View {
        VStack(spacing: 0) {
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
                filtersView
            }

            ScrollView {
                VStack(spacing: 16) {
                    if deliveries.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "shippingbox").font(.system(size: 64)).foregroundStyle(.secondary)
                            Text("No se encontraron envíos").font(.system(size: 18, weight: .semibold))
                            Text(searchText.isEmpty && statusFilter == nil && zoneFilter == nil
                                 ? "Crea tu primer envío para comenzar"
                                 : "Intenta ajustar los filtros")
                                .font(.system(size: 14)).foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 60)
                    } else {
                        ForEach(deliveries) { delivery in
                            deliveryCard(delivery)
                        }
                    }
                }
                .padding(16)
            }
        }
        .background(Color(.systemBackground))
        .sheet(isPresented: $showNotDeliveredModal) {
            notDeliveredSheet
        }
        .sheet(isPresented: $showRescheduleModal) {
            rescheduleSheet
        }
    }

    private var filtersView: some View {
        VStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Estado:").font(.system(size: 14, weight: .semibold))
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        filterChip("Todos", active: statusFilter == nil) { statusFilter = nil }
                        ForEach(DeliveryStatus.allCases.filter { [.pending, .inTransit, .delivered].contains($0) }, id: \.self) { status in
                            filterChip(status.label, active: statusFilter == status) { statusFilter = status }
                        }
                    }
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Zona:").font(.system(size: 14, weight: .semibold))
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        filterChip("Todas", active: zoneFilter == nil) { zoneFilter = nil }
                        ForEach(Zone.allCases, id: \.self) { zone in
                            filterChip(zone.label, active: zoneFilter == zone) { zoneFilter = zone }
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
    }

    private func filterChip(_ text: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(active ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(active ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(.tertiarySystemBackground))
                .clipShape(Capsule())
                .overlay(
                    Capsule().stroke(active ? Color.clear : Color(.separator), lineWidth: 1)
                )
        }
    }

    private func deliveryCard(_ delivery: Delivery) -> some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                HStack(spacing: 12) {
                    Text("#\(delivery.shortId)").font(.system(size: 14, weight: .semibold)).foregroundStyle(.secondary)
                    statusBadge(delivery.status)
                }
                Spacer()
                Text(delivery.zone.label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
            }

            // Body - sender & receiver
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("De:").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(delivery.sender.name).font(.system(size: 16, weight: .semibold))
                    Text(delivery.sender.phone).font(.system(size: 13)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                Image(systemName: "arrow.right").foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Para:").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(delivery.receiver.name).font(.system(size: 16, weight: .semibold))
                    Text(delivery.receiver.phone).font(.system(size: 13)).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            // Footer
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mensajero:").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text(delivery.messenger).font(.system(size: 14, weight: .semibold))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Total:").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text("Q \(delivery.total, specifier: "%.2f")")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32))
                }
            }
            .padding(.top, 16)
            .overlay(alignment: .top) { Divider() }

            if let desc = delivery.description, !desc.isEmpty {
                Text(desc).font(.system(size: 13)).foregroundStyle(.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            // Actions
            if isMessenger {
                if delivery.status == .delivered {
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                        Text("Paquete Entregado").font(.system(size: 16, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.green.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else if delivery.status == .notDelivered {
                    HStack(spacing: 10) {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.red)
                        VStack(alignment: .leading) {
                            Text("No Entregado").font(.system(size: 15, weight: .bold))
                            if let reason = delivery.notDeliveredReason {
                                Text("Motivo: \(reason)").font(.system(size: 12)).foregroundStyle(.red)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color.red.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    HStack(spacing: 8) {
                        actionBtn(title: "Entregado", icon: "checkmark.circle.fill", color: .green) {
                            handleMarkDelivered(delivery)
                        }
                        actionBtn(title: "Reprogramar", icon: "calendar", color: .orange) {
                            selectedDelivery = delivery
                            showRescheduleModal = true
                        }
                        actionBtn(title: "No Entregado", icon: "xmark.circle.fill", color: .red) {
                            selectedDelivery = delivery
                            notDeliveredReason = ""
                            showNotDeliveredModal = true
                        }
                    }
                }
            } else {
                actionBtn(title: "Imprimir", icon: "printer.fill", color: delivery.status == .delivered ? Color(red: 0.22, green: 0.27, blue: 0.32) : Color(red: 0.42, green: 0.46, blue: 0.52)) {
                    // Print not supported in simulator
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 2)
    }

    private func statusBadge(_ status: DeliveryStatus) -> some View {
        Text(status.label)
            .font(.system(size: 12, weight: .semibold))
            .padding(.horizontal, 12).padding(.vertical, 6)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .background(badgeBg(status))
    }

    private func badgeBg(_ status: DeliveryStatus) -> Color {
        switch status {
        case .pending: Color.yellow.opacity(0.2)
        case .inTransit: Color.blue.opacity(0.15)
        case .delivered: Color.green.opacity(0.15)
        case .cancelled, .notDelivered: Color.red.opacity(0.15)
        case .rescheduled: Color.orange.opacity(0.15)
        }
    }

    private func actionBtn(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 18))
                Text(title).font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    private func handleMarkDelivered(_ delivery: Delivery) {
        if isMessenger && (delivery.photos?.isEmpty ?? true) {
            return
        }
        store.updateDeliveryStatus(id: delivery.id, status: .delivered)
    }

    private var notDeliveredSheet: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Image(systemName: "xmark.circle.fill").font(.system(size: 32)).foregroundStyle(.red)
                Text("No Entregado").font(.system(size: 20, weight: .bold))
                Text("¿Por qué no se pudo entregar el paquete?").font(.system(size: 14)).foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Motivo").font(.system(size: 14, weight: .semibold))
                TextEditor(text: $notDeliveredReason)
                    .frame(minHeight: 100)
                    .padding(8)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            HStack(spacing: 12) {
                Button("Cancelar") { showNotDeliveredModal = false }
                    .buttonStyle(.bordered)
                Button("Confirmar") {
                    if let d = selectedDelivery, !notDeliveredReason.trimmingCharacters(in: .whitespaces).isEmpty {
                        store.updateDelivery(id: d.id, updates: [
                            "status": DeliveryStatus.notDelivered,
                            "notDeliveredReason": notDeliveredReason.trimmingCharacters(in: .whitespaces)
                        ])
                        showNotDeliveredModal = false
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .presentationDetents([.medium])
    }

    private var rescheduleSheet: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Image(systemName: "calendar").font(.system(size: 32)).foregroundStyle(.orange)
                Text("Reprogramar Envío").font(.system(size: 20, weight: .bold))
                Text("¿Deseas reprogramar este envío para otra fecha?").font(.system(size: 14)).foregroundStyle(.secondary)
            }
            HStack(spacing: 12) {
                Button("Cancelar") { showRescheduleModal = false }
                    .buttonStyle(.bordered)
                Button("Confirmar") {
                    if let d = selectedDelivery {
                        store.updateDeliveryStatus(id: d.id, status: .rescheduled)
                        showRescheduleModal = false
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}
