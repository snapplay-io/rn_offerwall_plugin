import { useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { S2Offerwall } from 'react-native-s2offerwall';

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

    S2Offerwall.initSdk();

    // 이벤트 구독
    S2Offerwall.onLoginRequested((event) => {
      if (event.name === 'onLoginRequested') {
        S2Offerwall.setUserName('USER_LOGIN', 'React 네이티드');
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
