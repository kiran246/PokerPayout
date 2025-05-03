import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Button = ({ title, onPress, style, textStyle, disabled }) => {
  return (
    
    <TouchableOpacity
    style={[styles.button, disabled && styles.buttonDisabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.text, textStyle]}>{title}</Text>
  </TouchableOpacity>
    
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3498DB',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Button;