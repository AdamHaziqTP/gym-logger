import AppKit

let destination = CommandLine.arguments.dropFirst().first ?? "Resources/Assets.xcassets/AppIcon.appiconset/QiblaIcon.png"
let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)

image.lockFocus()

NSColor(calibratedRed: 0.035, green: 0.03, blue: 0.055, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()

let center = NSPoint(x: 512, y: 512)
let ringRect = NSRect(x: 150, y: 150, width: 724, height: 724)
let ring = NSBezierPath(ovalIn: ringRect)
ring.lineWidth = 22
NSColor(calibratedRed: 0.66, green: 0.48, blue: 1.0, alpha: 0.78).setStroke()
ring.stroke()

let inner = NSBezierPath(ovalIn: NSRect(x: 245, y: 245, width: 534, height: 534))
inner.lineWidth = 4
NSColor.white.withAlphaComponent(0.20).setStroke()
inner.stroke()

for index in 0..<24 {
    let angle = Double(index) * 15.0 * .pi / 180.0
    let outer: CGFloat = 343
    let innerRadius: CGFloat = index % 6 == 0 ? 302 : 317
    let p1 = NSPoint(x: center.x + cos(angle) * outer, y: center.y + sin(angle) * outer)
    let p2 = NSPoint(x: center.x + cos(angle) * innerRadius, y: center.y + sin(angle) * innerRadius)
    let tick = NSBezierPath()
    tick.move(to: p1)
    tick.line(to: p2)
    tick.lineWidth = index % 6 == 0 ? 11 : 5
    NSColor.white.withAlphaComponent(index % 6 == 0 ? 0.85 : 0.30).setStroke()
    tick.stroke()
}

let purple = NSColor(calibratedRed: 0.66, green: 0.48, blue: 1.0, alpha: 1)
let needle = NSBezierPath()
needle.move(to: NSPoint(x: 512, y: 770))
needle.line(to: NSPoint(x: 452, y: 430))
needle.line(to: NSPoint(x: 512, y: 485))
needle.line(to: NSPoint(x: 572, y: 430))
needle.close()
purple.setFill()
needle.fill()

let kaaba = NSBezierPath(roundedRect: NSRect(x: 438, y: 355, width: 148, height: 132), xRadius: 16, yRadius: 16)
purple.setFill()
kaaba.fill()
NSColor.white.withAlphaComponent(0.95).setFill()
NSBezierPath(rect: NSRect(x: 454, y: 448, width: 116, height: 8)).fill()
NSColor.white.withAlphaComponent(0.22).setStroke()
kaaba.lineWidth = 4
kaaba.stroke()

image.unlockFocus()

guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
else {
    fatalError("Could not encode app icon")
}

let url = URL(fileURLWithPath: destination)
try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
try png.write(to: url)
print("Generated \(destination)")
