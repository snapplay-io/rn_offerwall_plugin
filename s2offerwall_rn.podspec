require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "s2offerwall_rn"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platform = :ios, '16.0'
  s.ios.deployment_target = '16.0'
  s.source       = { :git => "https://github.com/snapplay-io/rn_offerwall_plugin.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.dependency 's2offerwall', '~> 1.0.17'
  s.dependency 'React-Core'
  
  install_modules_dependencies(s)
end
