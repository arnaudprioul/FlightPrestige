//
//  FlightPrestigeHostApp.swift
//  FlightPrestigeHost
//

import SwiftUI
import AppKit

@main
struct FlightPrestigeHostApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    guard url.scheme == "flightprestige" else { return }
                    // Ouvre l'app Tauri si elle est installée
                    if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.flightprestige.app") {
                        NSWorkspace.shared.openApplication(at: appURL, configuration: NSWorkspace.OpenConfiguration(), completionHandler: nil)
                    } else {
                        // Fallback : ouvre le frontend dans le navigateur
                        NSWorkspace.shared.open(URL(string: "http://localhost:3000")!)
                    }
                }
        }
    }
}
