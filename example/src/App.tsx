import { useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { S2Offerwall } from 'react-native-s2offerwall';
import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// 앱 RV 연동 테스트 모드
// false 로 두면 광고 없이 더미로 동작하므로 연동 흐름만 먼저 확인할 수 있다.
const USE_ADMOB = true;

// 구글이 공개한 테스트용 리워드 광고 단위 ID 이다. 실제 매체 앱은 자신의 광고 단위를 사용한다.
const REWARDED_AD_UNIT_ID = TestIds.REWARDED;

let loadedAd: RewardedAd | null = null;

// 광고 하나를 로딩한다. 로딩되면 resolve(true), 광고가 없으면 resolve(false).
function loadRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);
    let settled = false;

    const unsubLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        unsubLoaded();
        unsubError();
        if (settled) return;
        settled = true;
        loadedAd = ad;
        resolve(true);
      }
    );

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      unsubLoaded();
      unsubError();
      if (settled) return;
      settled = true;
      console.log('RV 로딩 실패:', error);
      loadedAd = null;
      resolve(false);
    });

    ad.load();
  });
}

// 이벤트 페이지의 앱 RV 요청을 매체 앱이 처리하도록 콜백을 등록한다.
// 등록하지 않으면 이벤트 페이지는 기존처럼 웹 리워드 광고를 사용한다.
//
// 유저가 오퍼월을 열기 전에만 등록되어 있으면 되지만,
// removeAllListeners() 로 함께 해제되므로 앱 진입점에서 한 번만 등록하는 것이 좋다.
function initRewardedAd() {
  if (USE_ADMOB) {
    mobileAds().initialize();
  }

  S2Offerwall.onRewardedAdRequested(async (request) => {
    console.log('RV 로딩 요청:', request.requestId, request.slot);

    if (!USE_ADMOB) {
      // 더미 : 광고 없이 흐름만 확인한다.
      //
      // 주의) 여기서 setTimeout 으로 로딩 지연을 흉내내면 안된다.
      // Android 는 오퍼월이 별도 Activity 로 뜨면서 RN 의 호스트 Activity 가 pause 되고,
      // 그때 JS 타이머가 멈춘다. (JavaTimerManager.onHostPause -> clearFrameCallback)
      // 오퍼월이 떠 있는 동안 setTimeout 콜백은 발화하지 않으므로 응답이 나가지 못하고
      // 페이지는 타임아웃 -> 웹 광고 폴백으로 흘러간다.
      // (iOS 는 같은 앱의 모달 ViewController 라서 타이머가 정상 동작한다)
      request.onLoaded();
      //request.onNoAd();   // 광고 없음 -> 웹 광고로 폴백되는지 확인용
      return;
    }

    if (loadedAd != null) {
      // 미리 로딩해둔 광고가 있으면 즉시 응답한다.
      // 이벤트 페이지는 로딩을 몇 초만 기다리고 웹 광고로 넘어가므로
      // 실제 매체 앱에서는 미리 로딩해두는 것이 좋다.
      console.log('RV 이미 로딩됨');
      request.onLoaded();
      return;
    }

    const loaded = await loadRewardedAd();
    if (loaded) {
      request.onLoaded();
    } else {
      request.onNoAd();
    }
  });

  S2Offerwall.onRewardedAdShow((request) => {
    console.log('RV 재생 요청:', request.requestId);

    if (!USE_ADMOB) {
      // 로딩 단계와 같은 이유로 setTimeout 을 쓰지 않는다.
      request.onGranted();
      //request.onDismissed();   // 시청 중단 시 버튼이 원복되는지 확인용
      return;
    }

    const ad = loadedAd;
    loadedAd = null; // 리워드 광고는 1회만 재생할 수 있다.

    if (ad == null) {
      // 재생 단계의 실패는 onNoAd() 가 아니라 onDismissed() 로 알려야 한다.
      console.log('RV 재생할 광고 없음');
      request.onDismissed();
      return;
    }

    // 적립 이벤트는 광고가 닫히기 전에 도착한다.
    // 적립 여부를 기억해두었다가 닫히는 시점에 한 번만 결과를 알린다.
    let earned = false;
    let settled = false;

    const finish = (granted: boolean) => {
      if (settled) return;
      settled = true;
      unsubEarned();
      unsubClosed();
      unsubError();
      granted ? request.onGranted() : request.onDismissed();
    };

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('RV 적립:', reward);
        earned = true;
      }
    );

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('RV 닫힘. earned=', earned);
      finish(earned);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('RV 재생 실패:', error);
      finish(false);
    });

    ad.show();
  });
}

export default function App() {
  const handleShowOfferwall = async () => {
    try {
      await S2Offerwall.showOfferwall('main');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    S2Offerwall.presentATTPopup();
    S2Offerwall.setConsentDialogRequired(true);

    S2Offerwall.setAppIdForAndroid(
      '0d724e96d380f016521e1bba1d9142eae52893d29f484033cb06c3ad0f2ca651'
    );
    S2Offerwall.setAppIdForIOS(
      '0d724e96d380f016521e1bba1d9142eae52893d29f484033cb06c3ad0f2ca651'
    );

    initRewardedAd();

    S2Offerwall.initSdk();

    // 이벤트 구독
    S2Offerwall.onLoginRequested((event) => {
      if (event.name === 'onLoginRequested') {
        S2Offerwall.setUserName('USER_LOGIN', 'React 네이티브');
      }
    });

    S2Offerwall.onInitCompleted((event) => {
      if (event.name === 'onInitCompleted') {
        S2Offerwall.requestMaxPointData().then((data) => console.log(data));
        S2Offerwall.setUserName('USER_LOGIN', 'React 네이티브');
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      S2Offerwall.removeAllListeners();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Show Offerwall" onPress={handleShowOfferwall} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
