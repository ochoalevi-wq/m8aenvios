import Foundation

enum UserRole: String, Codable, CaseIterable {
    case admin
    case messenger
    case scheduler

    var label: String {
        switch self {
        case .admin: "Administrador"
        case .messenger: "Mensajero"
        case .scheduler: "Agendador"
        }
    }
}

enum LicenseType: String, Codable, CaseIterable {
    case A, B, C, M

    var label: String { "Licencia \(rawValue)" }
}

enum VehicleType: String, Codable, CaseIterable {
    case moto, carro, camion

    var label: String {
        switch self {
        case .moto: "Motocicleta"
        case .carro: "Automóvil"
        case .camion: "Camión"
        }
    }
}

enum DeliveryStatus: String, Codable, CaseIterable {
    case pending
    case inTransit = "in_transit"
    case delivered
    case cancelled
    case rescheduled
    case notDelivered = "not_delivered"

    var label: String {
        switch self {
        case .pending: "Pendiente"
        case .inTransit: "En Tránsito"
        case .delivered: "Entregado"
        case .cancelled: "Cancelado"
        case .rescheduled: "Reprogramado"
        case .notDelivered: "No Entregado"
        }
    }
}

enum PickupStatus: String, Codable, CaseIterable {
    case scheduled
    case collected
    case cancelled

    var label: String {
        switch self {
        case .scheduled: "Agendado"
        case .collected: "Recolectado"
        case .cancelled: "Cancelado"
        }
    }
}

enum Zone: String, Codable, CaseIterable {
    case zona1 = "zona_1"
    case zona2 = "zona_2"
    case zona3 = "zona_3"
    case zona4 = "zona_4"
    case zona5 = "zona_5"

    var label: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }

    var shippingCost: Double {
        switch self {
        case .zona1: 15
        case .zona2: 20
        case .zona3: 25
        case .zona4: 30
        case .zona5: 35
        }
    }
}

struct Person: Codable, Equatable {
    var name: String
    var phone: String
    var address: String
}

struct User: Codable, Equatable {
    var id: String
    var name: String
    var role: UserRole
}

struct Credential: Codable, Identifiable, Equatable {
    var id: String
    var username: String
    var password: String
    var role: UserRole
    var firstName: String
    var lastName: String
    var phoneNumber: String
    var createdAt: String
    var age: Int?
    var licenseType: LicenseType?
    var vehicleType: VehicleType?

    var fullName: String { "\(firstName) \(lastName)" }
}

struct Delivery: Codable, Identifiable, Equatable {
    var id: String
    var sender: Person
    var receiver: Person
    var messenger: String
    var messengerId: String?
    var zone: Zone
    var packageCost: Double
    var shippingCost: Double
    var status: DeliveryStatus
    var createdAt: String
    var updatedAt: String
    var description: String?
    var photos: [String]?
    var notDeliveredReason: String?
    var rescheduledDate: String?

    var total: Double { packageCost + shippingCost }
    var shortId: String { String(id.suffix(6)) }
}

struct DeliveryStats {
    var total: Int = 0
    var pending: Int = 0
    var inTransit: Int = 0
    var delivered: Int = 0
    var totalRevenue: Double = 0
}

struct Pickup: Codable, Identifiable, Equatable {
    var id: String
    var sender: Person
    var messenger: String
    var messengerId: String?
    var zone: Zone
    var scheduledDate: String
    var scheduledTime: String
    var status: PickupStatus
    var createdAt: String
    var updatedAt: String
    var notes: String?
    var packageCount: Int
    var pickupOnly: Bool?
    var cost: Double?

    var shortId: String { String(id.suffix(6)) }
}

struct PickupStats {
    var total: Int = 0
    var scheduled: Int = 0
    var collected: Int = 0
    var cancelled: Int = 0
}

struct MessengerInfo: Identifiable {
    var id: String
    var name: String
    var phone: String
    var isAvailable: Bool
}

struct MessengerStats: Identifiable {
    var id: String
    var name: String
    var totalDeliveries: Int
    var delivered: Int
    var inTransit: Int
    var pending: Int
    var totalRevenue: Double
    var averageDeliveryValue: Double
    var completionRate: Double
    var credential: Credential?
}
