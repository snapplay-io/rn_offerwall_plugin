import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { EventSubscription } from 'react-native';

// ✅ Native 모듈 이름은 S2OfferwallModule 입니다.
const { S2OfferwallModule } = NativeModules;

// 이벤트 타입 정의
export type S2OfferwallEvent =
  | { name: 'onInitCompleted'; flag: boolean }
  | { name: 'onLoginRequested'; param: string };

type EventCallback = (data: S2OfferwallEvent) => void;

// 핵심: S2OfferwallModule을 래핑하고 모든 메서드와 리스너를 포함하는 단일 객체입니다.
// 이 객체를 'S2Offerwall'이라는 이름으로 명시적으로 내보냅니다.
const eventEmitter = new NativeEventEmitter(S2OfferwallModule);
let subscriptions: EventSubscription[] = [];

export const S2Offerwall = {
  // --- 이벤트 구독 메서드 ---

  /**
   * @description 로그인 요청 이벤트를 구독합니다.
   */
  onLoginRequested(callback: EventCallback): EventSubscription {
    const sub = eventEmitter.addListener('onLoginRequested', callback as any);
    subscriptions.push(sub);
    return sub;
  },

  /**
   * @description SDK 초기화 완료 이벤트를 구독합니다.
   */
  onInitCompleted(callback: EventCallback): EventSubscription {
    const sub = eventEmitter.addListener('onInitCompleted', callback as any);
    subscriptions.push(sub);
    return sub;
  },

  /**
   * @description 등록된 모든 이벤트 리스너를 제거합니다.
   */
  removeAllListeners() {
    subscriptions.forEach((sub) => sub.remove());
    subscriptions = [];
  },

  // --- Native Module 메서드 ---

  // 모든 메서드는 NativeModules 객체에서 직접 호출되도록 래핑됩니다.

  initSdk(): Promise<void> {
    return S2OfferwallModule.initSdk();
  },

  showOfferwall(placementName: string): Promise<void> {
    return S2OfferwallModule.showOfferwall(placementName);
  },

  setAppId(appId: string): Promise<void> {
    return S2OfferwallModule.setAppId(appId);
  },

  setAppIdForAndroid(appId: string): Promise<void> {
    if (Platform.OS === 'android') {
      return S2OfferwallModule.setAppIdForAndroid(appId);
    }
    return Promise.resolve();
  },

  setAppIdForIOS(appId: string): Promise<void> {
    if (Platform.OS === 'ios') {
      return S2OfferwallModule.setAppId(appId);
    }
    return Promise.resolve();
  },

  setUserName(userName: string, displayName: string = ''): Promise<void> {
    return S2OfferwallModule.setUserName(userName, displayName);
  },

  getUserName(): Promise<string> {
    return S2OfferwallModule.getUserName();
  },

  resetUserName(): Promise<void> {
    return S2OfferwallModule.resetUserName();
  },

  presentATTPopup(): Promise<void> {
    return S2OfferwallModule.presentATTPopup();
  },

  setConsentDialogRequired(required: boolean): Promise<void> {
    return S2OfferwallModule.setConsentDialogRequired(required);
  },

  requestOfferwallData(
    placementName: string,
    isEmbeded: boolean
  ): Promise<string> {
    return S2OfferwallModule.requestOfferwallData(placementName, isEmbeded);
  },

  openAdItem(
    advId: number,
    needDetail: boolean,
    placementFrom: string
  ): Promise<void> {
    return S2OfferwallModule.openAdItem(advId, needDetail, placementFrom);
  },

  closeTop(): Promise<void> {
    return S2OfferwallModule.closeTop();
  },

  closeAll(): Promise<void> {
    return S2OfferwallModule.closeAll();
  },

  getPlatformVersion(): Promise<string> {
    return S2OfferwallModule.getPlatformVersion();
  },
};
