import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { EventSubscription } from 'react-native';

// ✅ Native 모듈 이름은 S2OfferwallModule 입니다.
const { S2OfferwallModule } = NativeModules;

// 이벤트 타입 정의
export type S2OfferwallEvent =
  | { name: 'onInitCompleted'; flag: boolean }
  | { name: 'onLoginRequested'; param: string };

type EventCallback = (data: S2OfferwallEvent) => void;

// 광고 길이 구분
export const S2RewardedAdSlot = {
  short: 'short',
  middle: 'middle',
  long: 'long',
  random: 'random',
} as const;

export type S2RewardedAdSlotType =
  (typeof S2RewardedAdSlot)[keyof typeof S2RewardedAdSlot];

/**
 * 오퍼월 이벤트 페이지가 리워드 광고(RV)를 필요로 할 때 전달되는 요청이다.
 *
 * 매체 앱은 자신의 리워드 광고(admob 등)를 재생하고 아래 메서드 중 하나로 결과를 알린다.
 * 각 요청은 반드시 한 번만 완료해야 하며, 추가 호출은 무시된다.
 *
 * 로딩 단계 - onRewardedAdRequested
 *  - onLoaded()   : 광고 준비 완료
 *  - onNoAd()     : 광고 없음. 이벤트 페이지는 기존 웹 광고로 폴백한다
 *
 * 재생 단계 - onRewardedAdShow
 *  - onGranted()   : 유저가 끝까지 시청함
 *  - onDismissed() : 유저가 광고를 닫았거나 재생에 실패함
 *
 * 주의) onNoAd() 는 로딩 단계 전용이다. 재생 단계의 실패는 onDismissed() 로 알려야 한다.
 * 재생 중에 광고 없음을 보고하면 이벤트 페이지가 폴백 처리를 하지 못해 버튼이 묶인다.
 */
export class S2RewardedAdRequest {
  /** 이 요청의 식별자. 결과를 되돌려 보낼 때 사용된다. */
  readonly requestId: string;

  /** 요청된 광고 길이. 재생 단계(onRewardedAdShow)에서는 빈 문자열이다. */
  readonly slot: string;

  constructor(requestId: string, slot: string) {
    this.requestId = requestId;
    this.slot = slot;
  }

  /** 리워드 광고가 준비되었음을 알린다. (로딩 단계) */
  onLoaded(): Promise<void> {
    return S2OfferwallModule.reportRewardedAdResult(this.requestId, 'loaded');
  }

  /** 재생할 광고가 없음을 알린다. (로딩 단계) */
  onNoAd(): Promise<void> {
    return S2OfferwallModule.reportRewardedAdResult(this.requestId, 'noad');
  }

  /** 유저가 광고를 끝까지 시청했음을 알린다. (재생 단계) */
  onGranted(): Promise<void> {
    return S2OfferwallModule.reportRewardedAdResult(this.requestId, 'granted');
  }

  /** 유저가 광고를 닫았거나 재생에 실패했음을 알린다. (재생 단계) */
  onDismissed(): Promise<void> {
    return S2OfferwallModule.reportRewardedAdResult(
      this.requestId,
      'dismissed'
    );
  }
}

export type RewardedAdCallback = (request: S2RewardedAdRequest) => void;

// 앱 RV 는 요청마다 반드시 응답해야 하므로, 콜백이 등록되지 않았어도
// 내부 리스너가 항상 붙어서 즉시 응답할 수 있어야 한다.
// (응답하지 않으면 이벤트 페이지가 타임아웃까지 기다린다)
let rewardedAdRequestedHandler: RewardedAdCallback | null = null;
let rewardedAdShowHandler: RewardedAdCallback | null = null;
let rewardedAdListenerBound = false;

function toRewardedAdRequest(event: any): S2RewardedAdRequest {
  return new S2RewardedAdRequest(event?.requestId ?? '', event?.slot ?? '');
}

function bindRewardedAdListeners() {
  if (rewardedAdListenerBound) {
    return;
  }
  rewardedAdListenerBound = true;

  const requested = eventEmitter.addListener(
    'onRewardedAdRequested',
    (event: any) => {
      const request = toRewardedAdRequest(event);
      if (rewardedAdRequestedHandler) {
        rewardedAdRequestedHandler(request);
      } else {
        // 매체 앱이 앱 RV 를 연동하지 않았다. 즉시 광고 없음으로 응답한다.
        request.onNoAd();
      }
    }
  );

  const show = eventEmitter.addListener('onRewardedAdShow', (event: any) => {
    const request = toRewardedAdRequest(event);
    if (rewardedAdShowHandler) {
      rewardedAdShowHandler(request);
    } else {
      // 정상적으로는 발생할 수 없지만, 방어적으로 중단 처리한다.
      request.onDismissed();
    }
  });

  subscriptions.push(requested, show);
}

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
   *
   * 앱 RV 콜백(onRewardedAdRequested / onRewardedAdShow)도 함께 해제됩니다.
   * 따라서 앱 RV 를 특정 화면에서만 등록하면 그 화면을 벗어난 뒤 동작하지 않습니다.
   * 앱 RV 콜백은 화면 컴포넌트가 아니라 앱 진입점에서 한 번만 등록하세요.
   */
  removeAllListeners() {
    subscriptions.forEach((sub) => sub.remove());
    subscriptions = [];

    rewardedAdListenerBound = false;
    rewardedAdRequestedHandler = null;
    rewardedAdShowHandler = null;
  },

  // --- 앱 RV ---

  /**
   * @description 이벤트 페이지가 리워드 광고 로딩을 요청할 때 호출된다.
   * 광고가 준비되면 request.onLoaded(), 광고가 없으면 request.onNoAd() 를 호출한다.
   * 등록하지 않으면 이벤트 페이지는 기존처럼 웹 리워드 광고를 사용한다.
   *
   * 콜백은 요청이 도착한 시점에 조회되므로 initSdk() 앞뒤 어디서 등록해도 동작한다.
   * 다만 등록 전에 요청이 도착하면 그 참여 1회는 웹 광고로 폴백되므로
   * (크래시나 멈춤은 없지만 조용히 수익만 놓친다),
   * 유저가 오퍼월을 열 수 있게 되기 전에 앱 진입점에서 등록해두는 것이 안전하다.
   */
  onRewardedAdRequested(callback: RewardedAdCallback) {
    rewardedAdRequestedHandler = callback;
    bindRewardedAdListeners();
  },

  /**
   * @description 로딩된 리워드 광고를 재생할 때 호출된다.
   * 시청이 완료되면 request.onGranted(),
   * 유저가 닫았거나 재생에 실패하면 request.onDismissed() 를 호출한다.
   *
   * onRewardedAdRequested 와 함께 앱 진입점에서 등록한다.
   */
  onRewardedAdShow(callback: RewardedAdCallback) {
    rewardedAdShowHandler = callback;
    bindRewardedAdListeners();
  },

  /**
   * @description 리워드 광고 요청의 결과를 알린다.
   * 보통은 S2RewardedAdRequest 의 메서드를 사용하면 되고 직접 쓸 일은 없다.
   * result 는 loaded, noad, granted, dismissed 중 하나이다.
   */
  reportRewardedAdResult(requestId: string, result: string): Promise<void> {
    return S2OfferwallModule.reportRewardedAdResult(requestId, result);
  },

  // --- Native Module 메서드 ---

  // 모든 메서드는 NativeModules 객체에서 직접 호출되도록 래핑됩니다.

  initSdk(): Promise<void> {
    // 콜백이 등록되지 않았더라도 앱 RV 요청에 응답할 수 있도록 리스너를 붙여둔다.
    bindRewardedAdListeners();

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

  requestMaxPointData(): Promise<string> {
    return S2OfferwallModule.requestMaxPointData();
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
