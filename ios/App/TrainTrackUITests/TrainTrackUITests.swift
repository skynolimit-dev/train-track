//
//  TrainTrackUITests.swift
//  TrainTrackUITests
//
//  Created by Mike Wagstaff on 15/07/2025.
//

import XCTest

final class TrainTrackUITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // Force portrait orientation for all tests
        XCUIDevice.shared.orientation = .portrait

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    @MainActor
    func testExample() throws {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()
        app.launch()

        // Use XCTAssert and related functions to verify your tests produce the correct results.
    }

    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }

    @MainActor
    func testTakeScreenshots() async {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        snapshot("01Favourites")

        // Tap "My Journeys" tab using aria-label
        snapshot("01bPreMyJourneys")
        app.buttons.matching(identifier: "My Journeys").firstMatch.tap()
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        snapshot("02MyJourneys")

        // Tap "Add Journey" tab using aria-label
        app.buttons.matching(identifier: "Add Journey").firstMatch.tap()
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        snapshot("03AddJourney")

        // Step 1: Enter "East Croydon" in the "from" field, and select "East Croydon"
        let fromField = app.textFields["From"]
        XCTAssertTrue(fromField.waitForExistence(timeout: 5))
        fromField.tap()
        sleep(1)
        // Use pasteboard to enter text
        #if targetEnvironment(simulator)
        let pasteboard = UIPasteboard.general
        pasteboard.string = "East Croydon"
        #endif
        fromField.doubleTap()
        if app.menuItems["Paste"].waitForExistence(timeout: 2) {
            app.menuItems["Paste"].tap()
        }
        print("From field value after paste: \(String(describing: fromField.value))")
        let eastCroydonCell = app.cells.staticTexts["East Croydon"]
        snapshot("03d-EnteredEastCroydon")
        XCTAssertTrue(eastCroydonCell.waitForExistence(timeout: 5))
        eastCroydonCell.tap()

        // Step 2: Enter "Gatwick Airport" in the "to" field, and select "Gatwick Airport"
        let toField = app.textFields["To"]
        XCTAssertTrue(toField.waitForExistence(timeout: 5))
        toField.tap()
        sleep(1)
        #if targetEnvironment(simulator)
        pasteboard.string = "Gatwick Airport"
        #endif
        toField.doubleTap()
        if app.menuItems["Paste"].waitForExistence(timeout: 2) {
            app.menuItems["Paste"].tap()
        }
        print("To field value after paste: \(String(describing: toField.value))")
        let gatwickCell = app.cells.staticTexts["Gatwick Airport"]
        snapshot("03d-EnteredGatwickAirport")
        XCTAssertTrue(gatwickCell.waitForExistence(timeout: 5))
        gatwickCell.tap()

        // Take a screenshot
        snapshot("03cAfterSelectingToAndFrom")

        // Step 3: Wait for the "Save and add return journey" button, and tap it when it appears
        let saveReturnButton = app.buttons["Save and add return journey"]
        XCTAssertTrue(saveReturnButton.waitForExistence(timeout: 10))
        saveReturnButton.tap()

        // Take a screenshot
        snapshot("03dAfterSaveReturnJourney")

        // Debug: Print all buttons and their identifiers/labels before tapping "My Journeys"
        let buttons = app.buttons.allElementsBoundByIndex
        for btn in buttons {
            print("Button identifier: \(btn.identifier), label: \(btn.label)")
        }
        // Take a screenshot for reference
        snapshot("03dButtonsDebug")

        // Step 5: Tap the "My Journeys" button again and take another screenshot
        app.buttons.matching(identifier: "My Journeys").firstMatch.tap()
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        snapshot("03eMyJourneysAfterAdd")

        // Hit the cancel button
        app.buttons.matching(identifier: "Cancel").firstMatch.tap()

        // Tap "Preferences" tab using aria-label
        snapshot("03bPrePreferences")
        app.buttons.matching(identifier: "Preferences").firstMatch.tap()
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        snapshot("04Preferences")
    }
}
