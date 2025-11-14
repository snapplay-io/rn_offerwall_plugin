#import "S2offerwall.h"

@implementation S2offerwall
- (NSNumber *)multiply:(double)a b:(double)b {
    NSNumber *result = @(a * b);

    return result;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeS2offerwallSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"S2offerwall";
}

@end
