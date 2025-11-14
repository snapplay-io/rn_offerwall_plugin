#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTLog.h>

#import <s2offerwall/s2offerwall-Swift.h>

// MARK: - Module Interface & Protocols

// S2OfferwallModule 인터페이스 정의 및 RCTBridgeModule, RCTEventEmitter 상속
@interface S2OfferwallModule : RCTEventEmitter <RCTBridgeModule, S2OfferwallEventListener, S2OfferwallInitializeListener>

@end

// MARK: - Implementation

@implementation S2OfferwallModule {
    BOOL hasListeners;
}

// 모듈 이름을 JavaScript에 노출합니다.
RCT_EXPORT_MODULE();

// MARK: - RCTEventEmitter Overrides

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onInitCompleted", @"onLoginRequested"];
}

- (void)startObserving {
    hasListeners = YES;
    // 이벤트 리스너가 추가될 때 네이티브 리스너를 설정할 수 있습니다.
    [S2Offerwall setEventListener:self];
}

- (void)stopObserving {
    hasListeners = NO;
    // 이벤트 리스너가 모두 제거되면 네이티브 리스너를 해제할 수 있습니다.
    [S2Offerwall setEventListener:nil];
}

// MARK: - Helper to send events

// Swift 코드의 private func sendEvent(_ name: String, body: [String: Any])를 대체
- (void)sendEvent:(NSString *)name body:(NSDictionary *)body {
    if (hasListeners) {
        [self sendEventWithName:name body:body];
    }
}

// MARK: - React Methods (RCT_EXPORT_METHOD)

// initSdk
RCT_EXPORT_METHOD(initSdk:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드의 S2Offerwall.setEventListener(self); 는 startObserving에서 처리됩니다.
    
    // Swift 코드: S2Offerwall.initSdk(self)
    // S2OfferwallInitializeListener 구현을 위해 self를 넘깁니다.
    [S2Offerwall initSdk:self]; 
    resolve(nil);
}

// showOfferwall
RCT_EXPORT_METHOD(showOfferwall:(NSString *)placementName
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: guard let vc = ...
    UIViewController *rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;

    if (!rootVC) {
        reject(@"NO_VIEWCONTROLLER", @"No root view controller", nil);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // Swift 코드: S2Offerwall.presentOfferwall(vc, placementName: placementName)
        [S2Offerwall presentOfferwall:rootVC placementName:placementName];
        resolve(nil);
    });

}

// setAppId
RCT_EXPORT_METHOD(setAppId:(NSString *)appId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: S2Offerwall.setAppId(appId)
    [S2Offerwall setAppId:appId];
    resolve(nil);
}

// setUserName
RCT_EXPORT_METHOD(setUserName:(NSString *)username
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: S2Offerwall.setUserName(username)
    [S2Offerwall setUserName:username];
    resolve(nil);
}

// getUserName
RCT_EXPORT_METHOD(getUserName:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: let username = S2Offerwall.getUserName() ?? ""
    NSString *username = [S2Offerwall getUserName];
    resolve(username ?: @""); // nil coalescing
}

// resetUserName
RCT_EXPORT_METHOD(resetUserName:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: S2Offerwall.resetUserName()
    [S2Offerwall resetUserName];
    resolve(nil);
}

RCT_EXPORT_METHOD(setConsentDialogRequired:(BOOL)required 
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    resolve(nil);
}

RCT_EXPORT_METHOD(presentATTPopup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: guard let vc = ...
    UIViewController *rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;

    if (!rootVC) {
        reject(@"NO_VIEWCONTROLLER", @"No root view controller", nil);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [S2Offerwall presentATTPopup:rootVC];
        resolve(nil);
    });
}

// requestOfferwallData
RCT_EXPORT_METHOD(requestOfferwallData:(NSString *)placementName 
                  isEmbeded:(BOOL)isEmbeded 
                  withResolver:(RCTPromiseResolveBlock)resolve 
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: S2Offerwall.requestOfferwallData(...) { data in resolve(data) }
  [S2Offerwall requestOfferwallDataWithPlacementName:placementName isEmbeded:isEmbeded completion:^(NSString * dataString) {
      // 받은 String 데이터를 Promise의 resolve로 전달합니다.
      resolve(dataString);
  }];

}

// openAdItem
RCT_EXPORT_METHOD(openAdItem:(NSInteger)advId
                  needDetail:(BOOL)needDetail
                  placementFrom:(NSString *)placementFrom
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: guard let vc = ...
    UIViewController *rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;

    if (!rootVC) {
        reject(@"NO_VIEWCONTROLLER", @"No root view controller", nil);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // Swift 코드: S2Offerwall.openAdItem(...)
        [S2Offerwall openAdItem:rootVC advId:advId needDetail:needDetail placementFrom:placementFrom];
        resolve(nil);
    });
}

// closeTop
RCT_EXPORT_METHOD(closeTop:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        // Swift 코드: S2Offerwall.closeTop() { resolve(nil) }
        [S2Offerwall closeTopWithCompletion:^(void) {
            resolve(nil);
        }];
    });
}

// closeAll
RCT_EXPORT_METHOD(closeAll:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        // Swift 코드: S2Offerwall.closeAll() { resolve(nil) }
        [S2Offerwall closeAllWithCompletion:^{
            resolve(nil);
        }];
    });
}

// getPlatformVersion
RCT_EXPORT_METHOD(getPlatformVersion:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    // Swift 코드: "iOS " + UIDevice.current.systemVersion
    NSString *platformVersion = [NSString stringWithFormat:@"iOS %@", [[UIDevice currentDevice] systemVersion]];
    resolve(platformVersion);
}

// MARK: - S2OfferwallEventListener

- (void)onLoginRequested:(NSString * _Nullable)param {
    // Swift 코드: sendEvent("onLoginRequested", body: ...)
    [self sendEvent:@"onLoginRequested" body:@{@"name": @"onLoginRequested", @"param": param ?: @""}];
}

// MARK: - S2OfferwallInitializeListener

- (void)onSuccess {
    // Swift 코드: sendEvent("onInitCompleted", body: ["flag": true])
    [self sendEvent:@"onInitCompleted" body:@{@"name": @"onInitCompleted", @"flag": @YES}];
}

- (void)onFailure {
    // Swift 코드: sendEvent("onInitCompleted", body: ["flag": false])
    [self sendEvent:@"onInitCompleted" body:@{@"name": @"onInitCompleted", @"flag": @NO}];
}

@end
