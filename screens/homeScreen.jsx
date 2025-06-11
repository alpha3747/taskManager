import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  SectionList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PickerModal from '@freakycoder/react-native-picker-modal';
import {Swipeable} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {moderateScale, verticalScale, scale} from '../utils/scale';

// Constants
const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLORS = {
  high: '#ff6b6b',
  medium: '#ffa502',
  low: '#2ed573',
};
const PRIORITY_ORDER = {high: 0, medium: 1, low: 2};

const HomeScreen = () => {
  // Refs
  const inputRef = useRef(null);
  const descriptionRef = useRef(null);

  // State
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  // Effects
  useEffect(() => {
    loadSavedTasks();
  }, []);

  // Data functions
  const loadSavedTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (error) {
      console.error('Failed loading tasks:', error);
    }
  };

  const saveTasks = async tasksToSave => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Saving failed:', error);
    }
  };

  // Task operations
  const addTask = async (taskText, taskDescription, priority) => {
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      description: taskDescription.trim(),
      priority: priority,
      completed: false,
      completedAt: null,
    };

    const updatedTasks = [...tasks, newTask].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    showToast('success', `Task added with "${priority}" priority`);
  };

  const deleteTask = async taskId => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.filter(t => t.id !== taskId);

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    showToast('info', `Deleted: "${taskToDelete.text}"`);
  };
  const toggleTaskCompletion = async taskId => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const isNowCompleted = !task.completed;

        Toast.show({
          type: 'success',
          text1: isNowCompleted ? 'Task completed!' : 'Task marked incomplete',
          visibilityTime: 1500,
        });

        return {
          ...task,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : null,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  // UI handlers
  const handleAddButtonPress = () => {
    if (!task.trim()) return;

    inputRef.current.blur();
    descriptionRef.current.blur();
    setTimeout(() => inputRef.current.focus(), 100);
    setModalVisible(true);
  };

  const handlePrioritySelect = selected => {
    const selectedPriority = selected.toLowerCase();
    addTask(task, description, selectedPriority);
    setTask('');
    setDescription('');
    setModalVisible(false);
  };

  const showToast = (type, message) => {
    Toast.show({
      type,
      text1: message,
      visibilityTime: 1500,
    });
  };

  // Filter and organize tasks
  const activeTasks = tasks.filter(
    t =>
      !t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const completedTasks = tasks.filter(
    t =>
      t.completed && t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sectionData = [
    {title: 'Active Tasks', data: activeTasks},
    {title: 'Completed Tasks', data: completedTasks},
  ];

  // Render helpers
  const renderRightActions = taskId => (
    <TouchableOpacity
      onPress={() => deleteTask(taskId)}
      activeOpacity={0.7}
      style={styles.swipeDeleteButton}>
      <Icon name="trash-can" size={26} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderTaskItem = ({item}) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View
        style={[
          styles.taskItem,
          {
            borderLeftColor: item.completed
              ? '#555'
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
      {/* Header */}
      <Text style={styles.heading}>WORK LABS</Text>

      {/* Search Bar */}
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

      {/* Task Input */}
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

      {/* Description Input */}
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

      {/* Priority Picker Modal */}
      <PickerModal
        title="Select Task Priority"
        isVisible={isModalVisible}
        data={PRIORITIES}
        onPress={handlePrioritySelect}
        onCancelPress={() => setModalVisible(false)}
        onBackdropPress={() => setModalVisible(false)}
      />

      {/* Task List - Updated to filter based on activeTab */}
      <SectionList
        style={styles.flatlist}
        sections={
          activeTab === 'active'
            ? [{title: 'Active Tasks', data: activeTasks}]
            : [{title: 'Completed Tasks', data: completedTasks}]
        }
        keyExtractor={item => item.id}
        renderItem={renderTaskItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText,
            ]}>
            Active ({activeTasks.length})
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
            Completed ({completedTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleAddButtonPress}
        activeOpacity={0.8}
        style={[
          styles.addButton,
          {
            backgroundColor: task.trim() ? '#00b894' : '#6C63FF',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
        ]}>
        <Icon name={task.trim() ? 'check' : 'plus'} size={24} color="#fff" />
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  heading: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: verticalScale(15),
    textTransform: 'uppercase',
    letterSpacing: scale(2),
  },
  inputContainer: {
    width: '95%',
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  descriptionContainer: {
    width: '95%',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 10,
  },
  descriptionInput: {
    backgroundColor: '#2A2A2A',
    color: '#ffffff',
    minHeight: verticalScale(60),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(5),
    fontSize: moderateScale(14),
    textAlignVertical: 'top',
  },
  searchContainer: {
    width: '95%',
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  sharedInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    color: '#ffffff',
    height: verticalScale(45),
    paddingHorizontal: scale(12),
    borderRadius: scale(5),
    fontSize: moderateScale(16),
  },
  searchIcon: {
    position: 'absolute',
    right: 20,
    color: '#00E6CC',
  },
  plusIcon: {
    marginLeft: 10,
    color: '#00E6CC',
  },
  flatlist: {
    width: '95%',
    marginTop: 10,
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#1E1E1E',
    minHeight: 70,
    borderRadius: 7,
    borderLeftWidth: 5,
    width: '100%',
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
    flexShrink: 1,
    lineHeight: 22,
    fontFamily:
      Platform.OS === 'android' ? 'sans-serif-light' : 'Times New Roman',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDescription: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
    fontFamily:
      Platform.OS === 'android' ? 'sans-serif-light' : 'Times New Roman',
  },
  completedTaskDescription: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  addButton: {
    position: 'absolute',
    bottom: verticalScale(20),
    right: scale(20),
    padding: moderateScale(20),
    borderRadius: scale(50),
  },
  addButtonText: {
    fontSize: moderateScale(24),
  },
  swipeDeleteButton: {
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '85%',
    marginVertical: 5,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 5,
    flexDirection: 'column',
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily:
      Platform.OS === 'android' ? 'sans-serif-medium' : 'Helvetica Neue',
  },
  sectionHeader: {
    backgroundColor: '#121212',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  sectionHeaderText: {
    color: '#00b894',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    width: '95%',
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
    bottom: verticalScale(77),
    right: scale(20),
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
