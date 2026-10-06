#!/usr/bin/env ruby
require "fileutils"
require "xcodeproj"

root = File.expand_path(__dir__)
project_path = File.join(root, "Qibla.xcodeproj")
FileUtils.rm_rf(project_path) if File.exist?(project_path)

project = Xcodeproj::Project.new(project_path)
project.root_object.attributes["LastSwiftUpdateCheck"] = "1600"
project.root_object.attributes["LastUpgradeCheck"] = "1600"

target = project.new_target(:application, "Qibla", :ios, "17.0")
target.product_reference.name = "Qibla.app"

sources_group = project.main_group.new_group("Qibla", "Sources")
Dir[File.join(root, "Sources", "*.swift")].sort.each do |file|
  ref = sources_group.new_reference(File.basename(file))
  target.source_build_phase.add_file_reference(ref)
end

vendor_group = project.main_group.new_group("Adhan", "Vendor/adhan-swift/Sources")
Dir[File.join(root, "Vendor", "adhan-swift", "Sources", "**", "*.swift")].sort.each do |file|
  relative = file.sub(File.join(root, "Vendor", "adhan-swift", "Sources") + "/", "")
  ref = vendor_group.new_reference(relative)
  target.source_build_phase.add_file_reference(ref)
end

resources_group = project.main_group.new_group("Resources", "Resources")
assets = resources_group.new_reference("Assets.xcassets")
target.resources_build_phase.add_file_reference(assets)

project.build_configurations.each do |config|
  config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "17.0"
end

target.build_configurations.each do |config|
  settings = config.build_settings
  settings["PRODUCT_BUNDLE_IDENTIFIER"] = "com.adamhaziq.qibla"
  settings["PRODUCT_NAME"] = "Qibla"
  settings["SWIFT_VERSION"] = "5.0"
  settings["IPHONEOS_DEPLOYMENT_TARGET"] = "17.0"
  settings["TARGETED_DEVICE_FAMILY"] = "1"
  settings["GENERATE_INFOPLIST_FILE"] = "YES"
  settings["INFOPLIST_KEY_CFBundleDisplayName"] = "Qibla"
  settings["INFOPLIST_KEY_NSLocationWhenInUseUsageDescription"] = "Your location is used on-device to calculate Qibla direction and select local prayer times."
  settings["INFOPLIST_KEY_UIApplicationSceneManifest_Generation"] = "YES"
  settings["INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents"] = "YES"
  settings["INFOPLIST_KEY_UILaunchScreen_Generation"] = "YES"
  settings["INFOPLIST_KEY_UISupportedInterfaceOrientations"] = "UIInterfaceOrientationPortrait"
  settings["ASSETCATALOG_COMPILER_APPICON_NAME"] = "AppIcon"
  settings["MARKETING_VERSION"] = "1.0.0"
  settings["CURRENT_PROJECT_VERSION"] = "1"
  settings["CODE_SIGN_STYLE"] = "Automatic"
  settings["SWIFT_EMIT_LOC_STRINGS"] = "NO"
  settings["ENABLE_USER_SCRIPT_SANDBOXING"] = "YES"
end

project.save
puts "Generated #{project_path}"
