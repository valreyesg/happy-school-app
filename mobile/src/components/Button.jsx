import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS } from '@/constants/theme';

export default function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  disabled = false,
  loading = false,
  icon = null,
  testID,
}) {
  const variantStyles = {
    primary: {
      bg: COLORS.purple.DEFAULT,
      text: COLORS.white,
      textDark: COLORS.white,
    },
    secondary: {
      bg: COLORS.blue.DEFAULT,
      text: COLORS.white,
      textDark: COLORS.white,
    },
    outline: {
      bg: 'transparent',
      text: COLORS.purple.DEFAULT,
      border: COLORS.purple.DEFAULT,
      textDark: COLORS.purple.DEFAULT,
    },
    ghost: {
      bg: COLORS.gray[100],
      text: COLORS.gray[700],
      textDark: COLORS.gray[800],
    },
    danger: {
      bg: COLORS.red.DEFAULT,
      text: COLORS.white,
      textDark: COLORS.white,
    },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, fontSize: 12 },
    md: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.lg, fontSize: 14 },
    lg: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: RADIUS.xl, fontSize: 16 },
  };

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerStyle = {
    backgroundColor: disabled ? COLORS.gray[200] : style.bg,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    paddingVertical: sizeStyle.paddingVertical,
    borderRadius: sizeStyle.borderRadius,
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: variant === 'outline' ? style.border : undefined,
    opacity: disabled ? 0.6 : 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const textStyle = {
    color: disabled ? COLORS.gray[600] : style.text,
    fontSize: sizeStyle.fontSize,
    fontWeight: '700',
    textAlign: 'center',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={containerStyle}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={style.textDark} />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
