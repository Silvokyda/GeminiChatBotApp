import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { supabase } from '../utils/supabase';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigation = useNavigation();

    const handleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) {
                throw error;
            }
            setOtpSent(true);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage('Error signing in: ' + error.message);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            });
    
            console.log('Verify OTP response:', session);
    
            if (error) {
                throw error;
            }
    
            const userId = session?.user?.id;
            const accessToken = session?.access_token; 
            
            if (userId && accessToken) {
                // Save the access token locally
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('userId', userId);
    
                setErrorMessage('');
                navigation.navigate('Chat', { userId });
            } else {
                setErrorMessage('Error: User ID or access token not found');
            }
        } catch (error) {
            setErrorMessage('Error verifying OTP: ' + error.message);
        }
    };
    
    

    return (
        <View style={styles.container}>
            {otpSent ? (
                <>
                    <View style={styles.backContainer}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            onPress={() => setOtpSent(false)}
                        />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                    />
                    <Button title="Verify OTP" onPress={handleVerifyOtp} />
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Button title="Send OTP" onPress={handleSignIn} />
                </>
            )}
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    input: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderColor: 'gray',
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    backContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    error: {
        color: 'red',
        marginTop: 10,
    },
});

export default LoginScreen;