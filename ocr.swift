import Foundation
import Vision
import AppKit

// Guard to ensure an argument is passed
guard CommandLine.arguments.count > 1 else {
    print("Usage: swift ocr.swift <image_path>")
    exit(1)
}

let imagePath = CommandLine.arguments[1]

// Check if file exists
guard FileManager.default.fileExists(atPath: imagePath) else {
    print("Error: File not found at \(imagePath)")
    exit(1)
}


// Load image
guard let image = NSImage(contentsOfFile: imagePath) else {
    print("Error: Could not create NSImage from file")
    exit(1)
}

guard let tiffData = image.tiffRepresentation else {
    print("Error: Could not get TIFF representation")
    exit(1)
}

guard let cgImage = NSBitmapImageRep(data: tiffData)?.cgImage else {
    print("Error: Could not get CGImage")
    exit(1)
}

// Create OCR Request
let request = VNRecognizeTextRequest { (request, error) in
    guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
    
    var fullText = ""
    for observation in observations {
        // Request top candidate
        guard let topCandidate = observation.topCandidates(1).first else { continue }
        fullText += topCandidate.string + "\n"
    }
    
    print(fullText)
}

// Configure request for accuracy
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["zh-Hans", "en-US"] // Hint Chinese and English

// Perform Request
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    print("Error performing request: \(error)")
}

