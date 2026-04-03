import WidgetKit
import SwiftUI

// MARK: - Data Model

struct DealEntry: TimelineEntry {
    let date: Date
    let deal: FlightDeal?
}

struct FlightDeal: Codable {
    let origin: String
    let destination: String
    let price: Double
    let currency: String
    let level: String       // "INSANE" | "GOOD"
    let airline: String
    let checkedAt: Date
}

// MARK: - Provider

struct FlightPrestigeProvider: TimelineProvider {
    func placeholder(in context: Context) -> DealEntry {
        DealEntry(date: Date(), deal: FlightDeal(
            origin: "CDG",
            destination: "JFK",
            price: 450,
            currency: "EUR",
            level: "INSANE",
            airline: "AF",
            checkedAt: Date()
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (DealEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DealEntry>) -> Void) {
        let deal = loadLatestDeal()
        let entry = DealEntry(date: Date(), deal: deal)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadLatestDeal() -> FlightDeal? {
        let defaults = UserDefaults(suiteName: "group.com.flightprestige.shared")
        guard let data = defaults?.data(forKey: "latestDeal"),
              let deal = try? JSONDecoder().decode(FlightDeal.self, from: data)
        else { return nil }
        return deal
    }
}

// MARK: - Widget View

struct FlightPrestigeWidgetView: View {
    let entry: DealEntry

    var body: some View {
        if let deal = entry.deal {
            DealView(deal: deal)
        } else {
            NoDealsView()
        }
    }
}

struct DealView: View {
    let deal: FlightDeal

    var badgeColor: Color {
        deal.level == "INSANE" ? Color.orange : Color.yellow
    }

    var body: some View {
        ZStack {
            Color(red: 0.03, green: 0.03, blue: 0.04)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(deal.level == "INSANE" ? "🔥 INSANE" : "✈️ GOOD")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(badgeColor)
                    Spacer()
                    Text(deal.airline)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(.secondary)
                }

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(deal.origin)
                        .font(.system(size: 16, weight: .black, design: .monospaced))
                    Text("→")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                    Text(deal.destination)
                        .font(.system(size: 16, weight: .black, design: .monospaced))
                }

                Text(formattedPrice)
                    .font(.system(size: 22, weight: .black, design: .monospaced))
                    .foregroundColor(.primary)

                Spacer()

                Text("Updated \(timeAgo(deal.checkedAt))")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
            }
            .padding(12)
        }
    }

    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = deal.currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: deal.price)) ?? "€\(Int(deal.price))"
    }

    func timeAgo(_ date: Date) -> String {
        let minutes = Int(Date().timeIntervalSince(date) / 60)
        if minutes < 60 { return "\(minutes)m ago" }
        return "\(minutes / 60)h ago"
    }
}

struct NoDealsView: View {
    var body: some View {
        ZStack {
            Color(red: 0.03, green: 0.03, blue: 0.04)
            VStack(spacing: 4) {
                Text("✈")
                    .font(.system(size: 24))
                Text("No deals yet")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Widget Configuration

@main
struct FlightPrestigeWidget: Widget {
    let kind = "FlightPrestigeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FlightPrestigeProvider()) { entry in
            FlightPrestigeWidgetView(entry: entry)
                .widgetURL(URL(string: "flightprestige://open")!)
        }
        .configurationDisplayName("FlightPrestige")
        .description("Alerts you when business class prices drop near economy levels.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

struct FlightPrestigeWidget_Previews: PreviewProvider {
    static var previews: some View {
        FlightPrestigeWidgetView(entry: DealEntry(
            date: Date(),
            deal: FlightDeal(
                origin: "CDG",
                destination: "JFK",
                price: 450,
                currency: "EUR",
                level: "INSANE",
                airline: "AF",
                checkedAt: Date()
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
