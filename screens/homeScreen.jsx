// toDo:
// move scheduling notification to another component
// fix: [notifee] no background event handler has been set. Set a handler via the "onBackgroundEvent" method.
// implement sounds
// implement intro screens
// fix ui for longer description tasks
// handle notifiction setting for overdue tasks
// handle notifiction still showing up even after marked completed  


import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  SectionList,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PickerModal from '@freakycoder/react-native-picker-modal';
import {Swipeable} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {moderateScale, verticalScale, scale} from '../utils/scale';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import notifee from '@notifee/react-native';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLORS = {
  high: '#ff6b6b',
  medium: '#ffa502',
  low: '#2ed573',
};
const PRIORITY_ORDER = {high: 0, medium: 1, low: 2};

const HomeScreen = () => {
  const inputRef = useRef(null);
  const descriptionRef = useRef(null);

  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);

  // schedule a notification

  const scheduleNotification = async (taskText, dueDate) => {
    try {
      console.log('Scheduling notification for task:', taskText, 'at', dueDate);

      // Create a notification channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });
      console.log('Channel created with ID:', channelId);

      // Create a trigger for the user-selected dueDate
      const trigger = {
        type: 0, // Use 0 for TIMESTAMP trigger type
        timestamp: new Date(dueDate).getTime(), // Convert to timestamp
      };
      console.log('Trigger set for:', new Date(dueDate).toLocaleString());

      // Schedule the notification
      await notifee.createTriggerNotification(
        {
          title: 'Task Reminder',
          body: `Your task "${taskText}" is due now!`,
          android: {
            channelId,
            smallIcon: 'ic_launcher',
          },
        },
        trigger,
      );
      console.log('Notification scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };
  // Update the addTask function to include scheduling a notification
  const addTask = async (text, desc, priority, dueDate) => {
    try {
      const newTask = {
        id: Date.now().toString(),
        text: text.trim(),
        description: desc.trim(),
        priority,
        completed: false,
        completedAt: null,
        dueDate: dueDate.toISOString(),
      };
      const updated = [...tasks, newTask].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      );
      setTasks(updated);
      await saveTasks(updated);

      // Schedule notification for the task
      await scheduleNotification(text, dueDate);

      Toast.show({
        type: 'success',
        text1: `Task added with ${priority} priority`,
      });
      setSelectedDate(new Date());
      setTask('');
      setDescription('');
      console.log('Task added successfully:', text);
    } catch (error) {
      console.error('Add task error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add task',
      });
    }
  };

  // requestNotificationPermission
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33)
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (error) {
        console.log('requestNotificationPermission', error);
      }
  };

  async function onDisplayNotification() {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'default channel',
    });
    await notifee.displayNotification({
      title: 'notification from worklabs',
      name: 'hard coded notifications from worklabs',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        sound: 'true',
      },
    });
  }

  // useEffect (()=>{
  //   const interval = setInterval(() => {
  //     console.log('notification useffect executing...');
  //     onDisplayNotification();
  //   }, 5000);

  //   return () => clearInterval(interval);

  // },[])

  useEffect(() => {
    requestNotificationPermission();
    loadSavedTasks();
  }, []);

  const loadSavedTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem('tasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  const saveTasks = async updated => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updated));
    } catch (error) {
      console.error('Save failed:', error);
    }
  };



  const deleteTask = async (id) => {
    try {
      console.log('Deleting task with ID:', id);
      const taskToDelete = tasks.find((t) => t.id === id);
      if (taskToDelete) {
        // Cancel the associated notification
        try {
          await notifee.cancelNotification(id);
          console.log('Canceled notification for task ID:', id);
        } catch (error) {
          console.warn('No notification to cancel or error canceling:', error);
        }
  
        // Remove task from list
        const updated = tasks.filter((t) => t.id !== id);
        setTasks(updated);
        await saveTasks(updated);
        Toast.show({ type: 'info', text1: `Deleted: ${taskToDelete.text}` });
        console.log('Task deleted successfully:', taskToDelete.text);
      } else {
        console.warn('Task not found for ID:', id);
      }
    } catch (error) {
      console.error('Delete task error:', error);
      Toast.show({ type: 'error', text1: 'Failed to delete task' });
    }
  };


  const editTask = async id => {
    try {
      console.log('Editing task with ID:', id);
      const toEdit = tasks.find(t => t.id === id);
      if (toEdit) {
        console.log('Found task to edit:', toEdit.text);

        // Cancel the existing notification for this task
        try {
          await notifee.cancelNotification(id);
          console.log('Canceled existing notification for task ID:', id);
        } catch (error) {
          console.warn('No notification to cancel or error canceling:', error);
        }

        // Populate input fields with task details
        setTask(toEdit.text);
        setDescription(toEdit.description);
        setSelectedDate(new Date(toEdit.dueDate));

        // Delete the old task
        await deleteTask(id);
        console.log('Deleted old task with ID:', id);

        // Focus the input field
        inputRef.current.focus();
        console.log('Input field focused for editing');
      } else {
        console.warn('Task not found for ID:', id);
      }
    } catch (error) {
      console.error('Edit task error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to edit task',
      });
    }
  };



  
  const toggleTaskCompletion = async (id) => {
    try {
      console.log('Toggling completion for task ID:', id);
      const updated = tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            }
          : t
      );
  
      // If task is being marked complete, cancel its notification
      if (updated.find((t) => t.id === id).completed) {
        try {
          await notifee.cancelNotification(id);
          console.log('Canceled notification for completed task ID:', id);
        } catch (error) {
          console.warn('No notification to cancel or error canceling:', error);
        }
      }
  
      setTasks(updated);
      await saveTasks(updated);
      Toast.show({
        type: 'success',
        text1: updated.find((t) => t.id === id).completed
          ? 'Task Completed'
          : 'Marked Incomplete',
      });
      console.log('Task completion toggled successfully for ID:', id);
    } catch (error) {
      console.error('Toggle completion error:', error);
      Toast.show({ type: 'error', text1: 'Failed to toggle task completion' });
    }
  };




  const handleAddButtonPress = () => {
    if (!task.trim()) return inputRef.current.focus();
    inputRef.current.blur();
    descriptionRef.current.blur();
    setModalVisible(true);
  };

  const handlePrioritySelect = priority => {
    try {
      setSelectedPriority(priority.toLowerCase());
      setModalVisible(false);
      setTimeout(() => setDatePickerVisibility(true), 200); // Delay to avoid modal conflict
    } catch (error) {
      console.error('Priority select error:', error);
    }
  };

  const handleDateConfirm = date => {
    try {
      setDatePickerVisibility(false);
      addTask(task, description, selectedPriority, date);
    } catch (error) {
      console.error('Date confirm error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to select date',
      });
    }
  };

  const handleDateCancel = () => {
    setDatePickerVisibility(false);
  };

  const filteredActive = tasks.filter(
    t =>
      !t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredCompleted = tasks.filter(
    t =>
      t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isOverdue = dueDate => {
    if (!dueDate) return false;
    return (
      new Date(dueDate) < new Date() &&
      !tasks.find(t => t.dueDate === dueDate)?.completed
    );
  };

  const formatDueDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRightActions = id => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity
        onPress={() => editTask(id)}
        activeOpacity={0.7}
        style={[styles.swipeActionButton, styles.swipeEditButton]}>
        <Icon name="pencil" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteTask(id)}
        activeOpacity={0.7}
        style={[styles.swipeActionButton, styles.swipeDeleteButton]}>
        <Icon name="trash-can" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderTaskItem = ({item}) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View
        style={[
          styles.taskItem,
          {
            borderLeftColor: item.completed
              ? '#555'
              : isOverdue(item.dueDate)
              ? '#ff4757'
              : PRIORITY_COLORS[item.priority],
          },
        ]}>
        <TouchableOpacity
          onPress={() => toggleTaskCompletion(item.id)}
          style={styles.radioButton}>
          <Icon
            name={
              item.completed
                ? 'checkbox-marked-circle'
                : 'checkbox-blank-circle-outline'
            }
            size={24}
            color={item.completed ? '#00b894' : '#aaa'}
          />
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskText,
              item.completed && styles.completedTaskText,
            ]}>
            {item.text}
          </Text>
          {item.description ? (
            <Text
              style={[
                styles.taskDescription,
                item.completed && styles.completedTaskDescription,
              ]}>
              {item.description}
            </Text>
          ) : null}
          {item.dueDate && (
            <View style={styles.dueDateContainer}>
              <Icon
                name="calendar-clock"
                size={14}
                color={
                  isOverdue(item.dueDate) && !item.completed
                    ? '#ff4757'
                    : '#aaa'
                }
              />
              <Text
                style={[
                  styles.dueDateText,
                  isOverdue(item.dueDate) &&
                    !item.completed &&
                    styles.overdueDueDateText,
                  item.completed && styles.completedTaskDescription,
                ]}>
                {formatDueDate(item.dueDate)}
                {isOverdue(item.dueDate) && !item.completed && ' (Overdue)'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );

  const renderSectionHeader = ({section: {title}}) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>WORK LABS</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.sharedInput}
          placeholder="Search tasks..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="magnify" size={22} color="#ccc" style={styles.searchIcon} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.sharedInput}
          placeholder="Add a new task..."
          placeholderTextColor="#aaa"
          value={task}
          onChangeText={setTask}
          onSubmitEditing={handleAddButtonPress}
        />
        <TouchableOpacity onPress={handleAddButtonPress}>
          <Icon
            name={task.trim() ? 'check' : 'plus'}
            size={22}
            color="#00b894"
            style={styles.plusIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.descriptionContainer}>
        <TextInput
          ref={descriptionRef}
          style={styles.descriptionInput}
          placeholder="Add description (optional)..."
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <PickerModal
        title="Select Task Priority"
        isVisible={isModalVisible}
        data={PRIORITIES}
        onPress={handlePrioritySelect}
        onCancelPress={() => setModalVisible(false)}
        onBackdropPress={() => setModalVisible(false)}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        minimumDate={new Date()}
        date={selectedDate}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        textColor="#fff"
        buttonTextColorIOS="#00b894"
        backdropStyleIOS={{backgroundColor: 'rgba(0,0,0,0.5)'}}
      />

      <SectionList
        style={styles.flatlist}
        sections={
          activeTab === 'active'
            ? [{title: 'Active Tasks', data: filteredActive}]
            : [{title: 'Completed Tasks', data: filteredCompleted}]
        }
        keyExtractor={item => item.id}
        renderItem={renderTaskItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText,
            ]}>
            Active ({filteredActive.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'completed' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('completed')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}>
            Completed ({filteredCompleted.length})
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleAddButtonPress}
        activeOpacity={0.8}
        style={[
          styles.addButton,
          {
            backgroundColor: task.trim() ? '#00b894' : '#6C63FF',
          },
        ]}>
        <Icon name={task.trim() ? 'check' : 'plus'} size={24} color="#fff" />
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  heading: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#00E6CC',
    marginBottom: verticalScale(15),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  descriptionContainer: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 10,
  },
  descriptionInput: {
    color: '#ffffff',
    minHeight: verticalScale(60),
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: moderateScale(14),
    textAlignVertical: 'top',
  },
  searchContainer: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  sharedInput: {
    flex: 1,
    color: '#ffffff',
    height: verticalScale(45),
    fontSize: moderateScale(16),
  },
  searchIcon: {
    color: '#00E6CC',
  },
  plusIcon: {
    color: '#00E6CC',
  },
  flatlist: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#1E1E1E',
    minHeight: 70,
    borderRadius: 7,
    borderLeftWidth: 5,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  radioButton: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDescription: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  completedTaskDescription: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    height: '85%',
    marginVertical: 5,
  },
  swipeActionButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeEditButton: {
    backgroundColor: '#3498db',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  swipeDeleteButton: {
    backgroundColor: '#ff4757',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
  },
  sectionHeaderText: {
    color: '#00b894',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#00b894',
  },
  tabText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  addButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  overdueDueDateText: {
    color: '#ff4757',
  },
});

export default HomeScreen;
