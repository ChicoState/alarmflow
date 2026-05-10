import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,                // overlay for edit form
  KeyboardAvoidingView, // keeps pickers visible
  Pressable,            // tap-to-dismiss
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from "./styles.js"



export interface EditModalProps {
  visible: boolean;
  initialStart: Date;
  initialEnd: Date;
  initialInterval: number;
  use24Hour: boolean;        
  onSave: (start: Date, end: Date, interval: number) => void;
  onCancel: () => void;
}

export function EditModal({
  visible,
  initialStart,
  initialEnd,
  initialInterval,
  use24Hour,               
  onSave,
  onCancel,
}: EditModalProps) {
  // copies of the three time pickers
  const [modalStart,    setModalStart]    = useState<Date>(initialStart);
  const [modalEnd,      setModalEnd]      = useState<Date>(initialEnd);
  const [modalInterval, setModalInterval] = useState<number>(initialInterval);

  const [showStartPicker,    setShowStartPicker]    = useState(false);
  const [showEndPicker,      setShowEndPicker]      = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  // sync local state each time the modal opens with fresh values
  useEffect(() => {
    if (visible) {
      setModalStart(initialStart);
      setModalEnd(initialEnd);
      setModalInterval(initialInterval);
      setShowStartPicker(false);
      setShowEndPicker(false);
      setShowIntervalPicker(false);
    }
  }, [visible, initialStart, initialEnd, initialInterval]);

  const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];

  // the options for the slider
  const timeLocaleOpts = use24Hour
    ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
    : { hour: '2-digit' as const, minute: '2-digit' as const };

  return (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onCancel}
  >
    <Pressable style={styles.editBackdrop} onPress={onCancel}>
      <Pressable onPress={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.editCard}>

            <View style={styles.editHandle} />

            <Text style={styles.editTitle}>
              Edit Alarm Set
            </Text>

            {/* Start */}
            <Text style={styles.editLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.editInputBox}
              onPress={() => {
                setShowEndPicker(false);
                setShowIntervalPicker(false);
                setShowStartPicker(true);
              }}
            >
              <Text style={styles.editInputText}>
                {modalStart.toLocaleTimeString([], timeLocaleOpts)}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={modalStart}
                mode="time"
                is24Hour={use24Hour}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selectedDate) setModalStart(selectedDate);
                }}
              />
            )}

            {/* End */}
            <Text style={styles.editLabelSpacing}>End Time</Text>
            <TouchableOpacity
              style={styles.editInputBox}
              onPress={() => {
                setShowStartPicker(false);
                setShowIntervalPicker(false);
                setShowEndPicker(true);
              }}
            >
              <Text style={styles.editInputText}>
                {modalEnd.toLocaleTimeString([], timeLocaleOpts)}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={modalEnd}
                mode="time"
                is24Hour={use24Hour}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) setModalEnd(selectedDate);
                }}
              />
            )}

            {/* Interval */}
            <Text style={styles.editLabelSpacing}>Interval</Text>
            <TouchableOpacity
              style={styles.editInputBox}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(false);
                setShowIntervalPicker((prev) => !prev);
              }}
            >
              <Text style={styles.editInputText}>
                Every {modalInterval} minutes
              </Text>
            </TouchableOpacity>

            {showIntervalPicker && (
              <View style={styles.editIntervalContainer}>
                {intervalOptions.map((min) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => {
                      setModalInterval(min);
                      setShowIntervalPicker(false);
                    }}
                    style={[
                      styles.editIntervalButton,
                      modalInterval === min && styles.editIntervalButtonActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.editIntervalText,
                        modalInterval === min && styles.editIntervalTextActive
                      ]}
                    >
                      {min} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Buttons */}
            <View style={styles.editButtonRow}>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.editButton, styles.editCancelButton]}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onSave(modalStart, modalEnd, modalInterval)}
                style={[styles.editButton, styles.editSaveButton]}
              >
                <Text style={styles.editSaveText}>Save Edit</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  </Modal>
);
}

export function EditSingleModal({
  visible,
  initialStart,
  initialEnd,
  initialInterval,
  use24Hour,               
  onSave,
  onCancel,
}: EditModalProps) {
  // copies of the three time pickers
  const [modalAlarmTime, setModalAlarmTime] = useState<Date>(initialStart);
  const [modalEnd,       setModalEnd]       = useState<Date>(initialStart);
  const [modalInterval,  setModalInterval]  = useState<number>(0);

  // repeat
  const [showStartPicker,       setShowStartPicker]       = useState(false);
  const [showEndPicker,         setShowEndPicker]         = useState(false);
  const [showIntervalPicker,    setShowIntervalPicker]    = useState(false);

  // single 
  const [alarmTime, setAlarmTime] = useState<Date>(new Date());
  const [showSingleAlarmPicker, setShowSingleAlarmPicker] = useState(false);
  const [showSingleAlarmModal, setShowSingleAlarmModal] = useState(false);
  

  // sync local state each time the modal opens with fresh values
  useEffect(() => {
    if (visible) {
      setModalAlarmTime(initialStart);
      //setModalEnd(initialStart);
      //setModalInterval(0);
      setShowSingleAlarmPicker(false);
    }
  }, [visible, initialStart]);

  //const intervalOptions = [1, 2, 3, 5, 10, 15, 20, 30];

  // the options for the slider
  const timeLocaleOpts = use24Hour
    ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
    : { hour: '2-digit' as const, minute: '2-digit' as const };

  return (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onCancel}
  >
    <Pressable style={styles.editBackdrop} onPress={onCancel}>
      <Pressable onPress={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.editCard}>

            <View style={styles.editHandle} />

            <Text style={styles.editTitle}>
              Edit Alarm Set
            </Text>

            {/* Alarm Time */}
            <Text style={styles.editLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.editInputBox}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(false);
                setShowIntervalPicker(false);
                setShowSingleAlarmPicker(true);
              }}
            >
              <Text style={styles.editInputText}>
                {modalAlarmTime.toLocaleTimeString([], timeLocaleOpts)}
              </Text>
            </TouchableOpacity>

            {showSingleAlarmPicker && (
              <DateTimePicker
                value={modalAlarmTime}
                mode="time"
                is24Hour={use24Hour}
                onChange={(event, selectedDate) => {
                  setShowSingleAlarmPicker(Platform.OS === 'ios');
                  if (selectedDate) setModalAlarmTime(selectedDate);
                }}
              />
            )}

            {/* Buttons */}
            <View style={styles.editButtonRow}>
              <TouchableOpacity
                onPress={onCancel}
                style={[styles.editButton, styles.editCancelButton]}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onSave(modalAlarmTime, modalAlarmTime, modalInterval)}
                style={[styles.editButton, styles.editSaveButton]}
              >
                <Text style={styles.editSaveText}>Save Edit</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Pressable>
  </Modal>
);
}

