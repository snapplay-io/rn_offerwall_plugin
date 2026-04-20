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
      'be17a4b66b6e3f22febd1a5bb698811f464c7cb613129fbbb7cf8a94fdccd651'
    );
    S2Offerwall.setAppIdForIOS(
      'b845e9bbb14bffd63c7f2a4ae64ee010464c7cb613129fbbb7cf8a94fdccd651'
    );

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
