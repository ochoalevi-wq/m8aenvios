import Foundation
import SwiftUI

@MainActor
@Observable
final class AppStore {
    // MARK: - Stored Properties
    var currentUser: User?
    var logo: String?
    var companyName: String = ""
    var credentials: [Credential] = []
    var deliveries: [Delivery] = []
    var pickups: [Pickup] = []
    var availability: [String: Bool] = [:]
    var whatsappNumber: String = ""
    var isLoading: Bool = true

    // MARK: - Keys
    private let kUser = "auth_user"
    private let kLogo = "app_logo"
    private let kCompany = "company_name"
    private let kCredentials = "app_credentials"
    private let kAvailability = "messenger_availability"
    private let kWhatsapp = "whatsapp_number"
    private let kDeliveries = "deliveries"
    private let kPickups = "pickups"

    init() {
        loadAll()
    }

    func loadAll() {
        currentUser = load(kUser, as: User.self)
        logo = UserDefaults.standard.string(forKey: kLogo)
        companyName = UserDefaults.standard.string(forKey: kCompany) ?? ""
        credentials = load(kCredentials, as: [Credential].self) ?? []
        availability = load(kAvailability, as: [String: Bool].self) ?? [:]
        whatsappNumber = UserDefaults.standard.string(forKey: kWhatsapp) ?? ""
        deliveries = load(kDeliveries, as: [Delivery].self) ?? []
        pickups = load(kPickups, as: [Pickup].self) ?? []
        isLoading = false
    }

    // MARK: - Auth
    var isAuthenticated: Bool { currentUser != nil }
    var hasAdminRegistered: Bool { credentials.contains { $0.role == .admin } }

    func login(username: String, password: String) throws {
        guard let cred = credentials.first(where: { $0.username == username && $0.password == password }) else {
            throw NSError(domain: "Auth", code: 1, userInfo: [NSLocalizedDescriptionKey: "Credenciales inválidas"])
        }
        let user = User(id: cred.id, name: cred.username, role: cred.role)
        currentUser = user
        save(user, forKey: kUser)
    }

    func logout() {
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: kUser)
    }

    func register(username: String, password: String) throws {
        guard !hasAdminRegistered else {
            throw NSError(domain: "Auth", code: 2, userInfo: [NSLocalizedDescriptionKey: "Ya existe un administrador registrado"])
        }
        let cred = Credential(
            id: "\(Date().timeIntervalSince1970)", username: username, password: password,
            role: .admin, firstName: "Admin", lastName: "Principal",
            phoneNumber: "", createdAt: ISO8601DateFormatter().string(from: Date())
        )
        credentials.append(cred)
        save(credentials, forKey: kCredentials)
        let user = User(id: cred.id, name: username, role: .admin)
        currentUser = user
        save(user, forKey: kUser)
    }

    // MARK: - Credentials
    func addCredential(_ cred: Credential) {
        credentials.append(cred)
        save(credentials, forKey: kCredentials)
    }

    func updateCredential(_ updated: Credential) {
        if let idx = credentials.firstIndex(where: { $0.id == updated.id }) {
            credentials[idx] = updated
            save(credentials, forKey: kCredentials)
        }
    }

    func deleteCredential(id: String) {
        credentials.removeAll { $0.id == id }
        save(credentials, forKey: kCredentials)
    }

    // MARK: - Availability
    func toggleAvailability(messengerId: String) {
        availability[messengerId] = !(availability[messengerId] ?? false)
        save(availability, forKey: kAvailability)
    }

    // MARK: - Messengers
    var messengers: [MessengerInfo] {
        credentials.filter { $0.role == .messenger }
            .map { MessengerInfo(id: $0.id, name: $0.fullName, phone: $0.phoneNumber, isAvailable: availability[$0.id] ?? false) }
    }

    var availableMessengers: [MessengerInfo] {
        messengers.filter { $0.isAvailable }
    }

    // MARK: - Deliveries
    func addDelivery(_ delivery: Delivery) {
        deliveries.insert(delivery, at: 0)
        save(deliveries, forKey: kDeliveries)
    }

    func updateDelivery(id: String, updates: [String: Any]) {
        guard let idx = deliveries.firstIndex(where: { $0.id == id }) else { return }
        var d = deliveries[idx]
        if let s = updates["status"] as? DeliveryStatus { d.status = s }
        if let photos = updates["photos"] as? [String] { d.photos = photos }
        if let reason = updates["notDeliveredReason"] as? String { d.notDeliveredReason = reason }
        if let date = updates["rescheduledDate"] as? String { d.rescheduledDate = date }
        if let messenger = updates["messenger"] as? String { d.messenger = messenger }
        if let messengerId = updates["messengerId"] as? String { d.messengerId = messengerId }
        d.updatedAt = ISO8601DateFormatter().string(from: Date())
        deliveries[idx] = d
        save(deliveries, forKey: kDeliveries)
    }

    func deleteDelivery(id: String) {
        deliveries.removeAll { $0.id == id }
        save(deliveries, forKey: kDeliveries)
    }

    func updateDeliveryStatus(id: String, status: DeliveryStatus) {
        updateDelivery(id: id, updates: ["status": status])
    }

    var deliveryStats: DeliveryStats {
        var s = DeliveryStats()
        for d in deliveries {
            s.total += 1
            if d.status == .pending { s.pending += 1 }
            if d.status == .inTransit { s.inTransit += 1 }
            if d.status == .delivered { s.delivered += 1 }
            s.totalRevenue += d.total
        }
        return s
    }

    func myDeliveryStats(userId: String) -> DeliveryStats {
        var s = DeliveryStats()
        for d in deliveries where d.messengerId == userId {
            s.total += 1
            if d.status == .pending { s.pending += 1 }
            if d.status == .inTransit { s.inTransit += 1 }
            if d.status == .delivered { s.delivered += 1 }
            s.totalRevenue += d.total
        }
        return s
    }

    func filteredDeliveries(status: DeliveryStatus?, zone: Zone?, search: String, messengerId: String?) -> [Delivery] {
        deliveries.filter { d in
            if let messengerId, d.messengerId != messengerId { return false }
            if let status, d.status != status { return false }
            if let zone, d.zone != zone { return false }
            if !search.isEmpty {
                let s = search.lowercased()
                if d.sender.name.lowercased().contains(s) || d.receiver.name.lowercased().contains(s) || d.messenger.lowercased().contains(s) {
                    return true
                }
                return false
            }
            return true
        }
    }

    // MARK: - Pickups
    func addPickup(_ pickup: Pickup) {
        pickups.insert(pickup, at: 0)
        save(pickups, forKey: kPickups)
    }

    func updatePickupStatus(id: String, status: PickupStatus) {
        guard let idx = pickups.firstIndex(where: { $0.id == id }) else { return }
        pickups[idx].status = status
        pickups[idx].updatedAt = ISO8601DateFormatter().string(from: Date())
        save(pickups, forKey: kPickups)
    }

    func deletePickup(id: String) {
        pickups.removeAll { $0.id == id }
        save(pickups, forKey: kPickups)
    }

    func filteredPickups(status: PickupStatus?, zone: Zone?, search: String, messengerId: String?) -> [Pickup] {
        pickups.filter { p in
            if let messengerId, p.messengerId != messengerId { return false }
            if let status, p.status != status { return false }
            if let zone, p.zone != zone { return false }
            if !search.isEmpty {
                let s = search.lowercased()
                return p.sender.name.lowercased().contains(s) || p.messenger.lowercased().contains(s)
            }
            return true
        }
    }

    var pickupStats: PickupStats {
        var s = PickupStats()
        for p in pickups {
            s.total += 1
            if p.status == .scheduled { s.scheduled += 1 }
            if p.status == .collected { s.collected += 1 }
            if p.status == .cancelled { s.cancelled += 1 }
        }
        return s
    }

    // MARK: - Messenger Stats
    func messengerStatsList() -> [MessengerStats] {
        let messengerCreds = credentials.filter { $0.role == .messenger }
        var statsList: [MessengerStats] = []
        for cred in messengerCreds {
            var stats = MessengerStats(
                id: cred.id, name: cred.fullName, totalDeliveries: 0,
                delivered: 0, inTransit: 0, pending: 0, totalRevenue: 0,
                averageDeliveryValue: 0, completionRate: 0, credential: cred
            )
            for d in deliveries where d.messengerId == cred.id {
                stats.totalDeliveries += 1
                stats.totalRevenue += d.total
                if d.status == .delivered { stats.delivered += 1 }
                if d.status == .inTransit { stats.inTransit += 1 }
                if d.status == .pending { stats.pending += 1 }
            }
            if stats.totalDeliveries > 0 {
                stats.averageDeliveryValue = stats.totalRevenue / Double(stats.totalDeliveries)
                stats.completionRate = Double(stats.delivered) / Double(stats.totalDeliveries) * 100
            }
            statsList.append(stats)
        }
        return statsList.sorted { $0.totalDeliveries > $1.totalDeliveries }
    }

    var topPerformer: MessengerStats? {
        messengerStatsList().max(by: { $0.completionRate < $1.completionRate })
    }

    // MARK: - Settings
    func updateLogo(_ uri: String?) {
        if let uri {
            UserDefaults.standard.set(uri, forKey: kLogo)
        } else {
            UserDefaults.standard.removeObject(forKey: kLogo)
        }
        logo = uri
    }

    func updateCompanyName(_ name: String) {
        UserDefaults.standard.set(name, forKey: kCompany)
        companyName = name
    }

    func updateWhatsappNumber(_ number: String) {
        UserDefaults.standard.set(number, forKey: kWhatsapp)
        whatsappNumber = number
    }

    // MARK: - Persistence Helpers
    private func save<T: Encodable>(_ value: T, forKey key: String) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func load<T: Decodable>(_ key: String, as type: T.Type) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
