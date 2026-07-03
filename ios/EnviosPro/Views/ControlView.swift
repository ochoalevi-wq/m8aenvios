import SwiftUI

struct ControlView: View {
    @Environment(AppStore.self) private var store

    private var isAdmin: Bool { store.currentUser?.role == .admin }

    private var todayDeliveries: [Delivery] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        return store.deliveries.filter {
            cal.startOfDay(for: ISO8601DateFormatter().date(from: $0.createdAt) ?? Date()) == today && $0.status != .delivered
        }
    }

    private var last7DaysClients: Int {
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        var uniqueClients = Set<String>()
        for d in store.deliveries {
            if let created = ISO8601DateFormatter().date(from: d.createdAt), created >= sevenDaysAgo {
                uniqueClients.insert(d.sender.phone)
                uniqueClients.insert(d.receiver.phone)
            }
        }
        return uniqueClients.count
    }

    private var pendingApprovals: Int {
        store.credentials.filter { $0.role == .messenger }.count
    }

    var body: some View {
        Group {
            if !isAdmin {
                VStack {
                    Text("Solo los administradores pueden acceder a esta sección")
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(24)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        Text("Panel de Control (Admin)")
                            .font(.system(size: 22, weight: .bold))
                            .frame(maxWidth: .infinity, alignment: .leading)

                        // Stats grid
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                            statCard(title: "Estado General", value: "\(todayDeliveries.count)", label: "Envíos Activos Hoy") {
                                HStack {
                                    VStack {
                                        Text("5/23%").font(.system(size: 14, weight: .semibold))
                                        Text("Quincenal").font(.system(size: 11)).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    VStack {
                                        Text("90%").font(.system(size: 14, weight: .semibold))
                                        Text("Delta").font(.system(size: 11)).foregroundStyle(.secondary)
                                    }
                                }
                            }

                            statCard(title: "Rendimiento por Zona", value: "", label: "") {
                                VStack(spacing: 4) {
                                    ForEach(Zone.allCases.prefix(3), id: \.self) { zone in
                                        let zoneDeliveries = store.deliveries.filter { $0.zone == zone }
                                        let completed = zoneDeliveries.filter { $0.status == .delivered }.count
                                        let pct = zoneDeliveries.isEmpty ? 0 : Double(completed) / Double(zoneDeliveries.count) * 100
                                        HStack {
                                            Text(zone.label).font(.system(size: 10)).foregroundStyle(.secondary)
                                            Spacer()
                                            Text("\(Int(pct))%").font(.system(size: 10, weight: .semibold))
                                        }
                                        GeometryReader { geo in
                                            ZStack(alignment: .leading) {
                                                RoundedRectangle(cornerRadius: 3).fill(Color(.tertiarySystemBackground)).frame(height: 6)
                                                RoundedRectangle(cornerRadius: 3).fill(Color(red: 0.22, green: 0.27, blue: 0.32))
                                                    .frame(width: geo.size.width * min(pct / 100, 1), height: 6)
                                            }
                                        }
                                        .frame(height: 6)
                                    }
                                }
                            }

                            statCard(title: "Nuevos Clientes", value: "\(last7DaysClients)", label: "Últimos 7 Días") {
                                Text("(1)").font(.system(size: 12)).foregroundStyle(.secondary)
                            }
                        }

                        // Tasks section
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Tareas Pendientes").font(.system(size: 18, weight: .bold))

                            Button {} label: {
                                Text("Crear Nuevo Envío")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity).padding(.vertical, 16)
                                    .background(Color(red: 0.97, green: 0.45, blue: 0.09))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            VStack(spacing: 0) {
                                taskRow(icon: "person.2.fill", text: "Aprobar nuevos conductores (\(pendingApprovals))")
                                Divider()
                                taskRow(icon: "exclamationmark.circle.fill", text: "Revisar incidencias (1)")
                                Divider()
                                taskRow(icon: "doc.text.fill", text: "Generar reporte semanal (1)")
                            }
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .padding(.top, 8)
                    }
                    .padding(16)
                    .padding(.bottom, 100)
                }
                .background(Color(red: 0.91, green: 0.93, blue: 0.95))
            }
        }
    }

    private func statCard<Content: View>(title: String, value: String, label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 13, weight: .semibold)).foregroundStyle(.secondary)
            if !value.isEmpty {
                Text(value).font(.system(size: 32, weight: .bold)).foregroundStyle(.primary)
            }
            if !label.isEmpty {
                Text(label).font(.system(size: 12)).foregroundStyle(.secondary)
            }
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }

    private func taskRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 6).fill(Color.blue.opacity(0.1)).frame(width: 32, height: 32)
                Image(systemName: icon).foregroundStyle(Color(red: 0.22, green: 0.27, blue: 0.32)).font(.system(size: 16))
            }
            Text(text).font(.system(size: 14)).foregroundStyle(Color(red: 0.29, green: 0.33, blue: 0.39))
            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 12)
    }
}
