import React from 'react';
import { Modal, View, Pressable, ScrollView, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

export default function ModalSheet({
  visible,
  onClose,
  children,
  title,
  testID,
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      testID={testID}
    >
      {/* Overlay */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        }}
      />

      {/* Sheet */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: COLORS.white,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 16,
          maxHeight: '90%',
        }}
      >
        {/* Handle visual */}
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.gray[300],
            marginBottom: 12,
          }}
        />

        {/* Header with title and close button */}
        {title && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.gray[100],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: COLORS.gray[800],
              }}
            >
              {title}
            </Text>
            <Pressable onPress={onClose}>
              <X size={24} color={COLORS.gray[600]} />
            </Pressable>
          </View>
        )}

        {/* Content */}
        <ScrollView
          style={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
