// HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Platform, SectionList, PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PickerModal from '@freakycoder/react-native-picker-modal';
import { Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import notifee from '@notifee/react-native';

import {
  scheduleTaskNotification,
  cancelTaskNotification,
} from './notificationsService';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLORS = { high: '#ff6b6b', medium: '#ffa502', low: '#2ed573' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const HomeScreen = () => {
  const inputRef = useRef();
  const descriptionRef = useRef();

  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);

  useEffect(() => {
    requestNotificationPermission();
    loadSavedTasks();
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('[ForegroundEvent]', type, detail);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    tasks.forEach(task => {
      if (!task.completed && new Date(task.dueDate) > new Date()) {
        scheduleTaskNotification(task.id, task.text, task.dueDate);
      }
    });
  }, [tasks]);

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
  };

  const loadSavedTasks = async () => {
    const saved = await AsyncStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  };

  const saveTasks = async (list) => {
    await AsyncStorage.setItem('tasks', JSON.stringify(list));
  };

  const addTask = async (text, desc, priority, dueDate) => {
    const newTask = {
      id: Date.now().toString(),
      text: text.trim(),
      description: desc.trim(),
      priority,
      completed: false,
      completedAt: null,
      dueDate: dueDate.toISOString(),
    };
    const updated = [...tasks, newTask].sort((a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );
    setTasks(updated);
    await saveTasks(updated);

    await scheduleTaskNotification(newTask.id, text, dueDate);

    Toast.show({ type: 'success', text1: `Task added with ${priority} priority` });
    setSelectedDate(new Date());
    setTask('');
    setDescription('');
  };

  const deleteTask = async (id) => {
    const toDelete = tasks.find(t => t.id === id);
    if (toDelete) await cancelTaskNotification(id);

    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await saveTasks(updated);

    Toast.show({ type: 'info', text1: `Deleted: ${toDelete.text}` });
  };

  const editTask = async (id) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;

    await cancelTaskNotification(id);
    setTask(t.text);
    setDescription(t.description);
    setSelectedDate(new Date(t.dueDate));
    await deleteTask(id);
    inputRef.current.focus();
  };

  const toggleTaskCompletion = async (id) => {
    const updated = tasks.map(t =>
      t.id === id
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null,
          }
        : t
    );
    setTasks(updated);
    await saveTasks(updated);

    if (updated.find(t => t.id === id).completed) {
      await cancelTaskNotification(id);
      Toast.show({ type: 'success', text1: 'Task Completed' });
    } else Toast.show({ type: 'success', text1: 'Marked Incomplete' });
  };

  const handleAddButtonPress = () => {
    if (!task.trim()) return inputRef.current.focus();
    inputRef.current.blur();
    descriptionRef.current.blur();
    setModalVisible(true);
  };

  const handlePrioritySelect = (p) => {
    setSelectedPriority(p.toLowerCase());
    setModalVisible(false);
    setTimeout(() => setDatePickerVisibility(true), 200);
  };

  const handleDateConfirm = (date) => {
    setDatePickerVisibility(false);
    addTask(task, description, selectedPriority, date);
  };

  const filteredActive = tasks.filter(t => !t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCompleted = tasks.filter(t => t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const isOverdue = (dueDate) => new Date(dueDate) < new Date() && !tasks.find(t => t.dueDate === dueDate)?.completed;
  const formatDueDate = dateString => new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const renderRightActions = (id) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity onPress={() => editTask(id)} style={[styles.swipeActionButton, styles.swipeEditButton]}>
        <Icon name="pencil" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTask(id)} style={[styles.swipeActionButton, styles.swipeDeleteButton]}>
        <Icon name="trash-can" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderTaskItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={[
        styles.taskItem,
        { borderLeftColor: item.completed ? '#555' : isOverdue(item.dueDate) ? '#ff4757' : PRIORITY_COLORS[item.priority] }
      ]}>
        <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)} style={styles.radioButton}>
          <Icon name={item.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={24} color={item.completed ? '#00b894' : '#aaa'} />
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>{item.text}</Text>
          {item.description ? <Text style={[styles.taskDescription, item.completed && styles.completedTaskDescription]}>{item.description}</Text> : null}
          {item.dueDate && (
            <View style={styles.dueDateContainer}>
              <Icon name="calendar-clock" size={14} color={isOverdue(item.dueDate) && !item.completed ? '#ff4757' : '#aaa'} />
              <Text style={[styles.dueDateText, isOverdue(item.dueDate) && !item.completed && styles.overdueDueDateText, item.completed && styles.completedTaskDescription]}>
                {formatDueDate(item.dueDate)}{isOverdue(item.dueDate) && ' (Overdue)'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>WORK LABS</Text>

      <View style={styles.searchContainer}>
        <TextInput style={styles.sharedInput} placeholder="Search tasks..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
        <Icon name="magnify" size={22} color="#ccc" style={styles.searchIcon} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput ref={inputRef} style={styles.sharedInput} placeholder="Add a new task..." placeholderTextColor="#aaa" value={task} onChangeText={setTask} onSubmitEditing={handleAddButtonPress} />
        <TouchableOpacity onPress={handleAddButtonPress}>
          <Icon name={task.trim() ? 'check' : 'plus'} size={22} color="#00b894" style={styles.plusIcon} />
        </TouchableOpacity>
      </View>

      <TextInput ref={descriptionRef} style={styles.descriptionInput} placeholder="Add description (optional)..." placeholderTextColor="#aaa" value={description} onChangeText={setDescription} multiline />

      <PickerModal title="Select Task Priority" isVisible={isModalVisible} data={PRIORITIES} onPress={handlePrioritySelect} onCancelPress={() => setModalVisible(false)} onBackdropPress={() => setModalVisible(false)} />

      <DateTimePickerModal isVisible={isDatePickerVisible} mode="datetime" minimumDate={new Date()} date={selectedDate} onConfirm={handleDateConfirm} onCancel={() => setDatePickerVisibility(false)} textColor="#fff" buttonTextColorIOS="#00b894" backdropStyleIOS={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      <SectionList style={styles.flatlist} sections={ activeTab === 'active' ? [{ title: 'Active Tasks', data: filteredActive }] : [{ title: 'Completed Tasks', data: filteredCompleted }] } keyExtractor={i => i.id} renderItem={renderTaskItem} renderSectionHeader={({ section }) => <Text style={styles.sectionHeaderText}>{section.title}</Text>} stickySectionHeadersEnabled={false} />

      <View style={styles.tabContainer}>
        {['active','completed'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({(tab === 'active' ? filteredActive.length : filteredCompleted.length)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleAddButtonPress} style={[styles.addButton, { backgroundColor: task.trim() ? '#00b894' : '#6C63FF' }]}>
        <Icon name={task.trim() ? 'check' : 'plus'} size={24} color="#fff" />
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  heading: { fontSize: 28, fontWeight: 'bold', color: '#00E6CC', marginBottom: 15, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#2A2A2A', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  inputContainer: { flexDirection: 'row', backgroundColor: '#2A2A2A', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  sharedInput: { flex: 1, color: '#fff', height: 45, fontSize: 16 },
  plusIcon: {},
  searchIcon: {},
  descriptionInput: { backgroundColor: '#2A2A2A', borderRadius: 8, color: '#fff', minHeight: 60, padding: 15, fontSize: 14, marginBottom: 10, textAlignVertical: 'top' },
  flatlist: { flex: 1 },
  taskItem: { backgroundColor: '#1E1E1E', borderLeftWidth: 5, borderRadius: 7, marginVertical: 5, flexDirection: 'row', padding: 15, alignItems: 'flex-start' },
  radioButton: { marginRight: 10, marginTop: 5 },
  taskContent: { flex: 1 },
  taskText: { fontSize: 16, color: '#fff', flexWrap: 'wrap' },
  completedTaskText: { color: '#888', textDecorationLine: 'line-through' },
  taskDescription: { fontSize: 14, color: '#aaa', marginTop: 4, flexWrap: 'wrap' },
  completedTaskDescription: { color: '#666', textDecorationLine: 'line-through' },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dueDateText: { fontSize: 12, color: '#aaa', marginLeft: 4, fontStyle: 'italic' },
  overdueDueDateText: { color: '#ff4757' },
  swipeActionsContainer: { flexDirection: 'row', height: '85%', marginVertical: 5 },
  swipeActionButton: { width: 60, justifyContent: 'center', alignItems: 'center' },
  swipeEditButton: { backgroundColor: '#3498db', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  swipeDeleteButton: { backgroundColor: '#ff4757', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  sectionHeaderText: { color: '#00b894', fontSize: 16, fontWeight: 'bold', paddingVertical: 8 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#2A2A2A', borderRadius: 8, overflow: 'hidden', marginVertical: 10 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#00b894' },
  tabText: { color: '#aaa', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  addButton: { position: 'absolute', bottom: 90, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
