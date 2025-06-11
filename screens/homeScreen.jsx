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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PickerModal from '@freakycoder/react-native-picker-modal';
import {Swipeable} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {moderateScale, verticalScale, scale} from '../utils/scale';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_ORDER = {high: 0, medium: 1, low: 2};

const HomeScreen = () => {
  const {width, height} = useWindowDimensions();
  const inputRef = useRef(null);

  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  /** Load tasks from storage on mount */
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const saved = await AsyncStorage.getItem('tasks');
        if (saved) setTasks(JSON.parse(saved));
      } catch (error) {
        console.error('Failed loading tasks:', error);
      }
    };
    loadTasks();
  }, []);

  /** Save task to storage */
  const saveTasks = async updatedTasks => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Saving failed:', error);
    }
  };

  /** Add task button pressed */
  const handleAddButtonPress = () => {
    inputRef.current.blur();
    setTimeout(() => inputRef.current.focus(), 100);
    if (task.trim()) {
      setModalVisible(true);
    }
  };

  /** On selecting priority from modal */
  const handlePrioritySelect = async selected => {
    const selectedPriority = selected.toLowerCase();

    const newTask = {
      id: Date.now().toString(),
      text: task.trim(),
      priority: selectedPriority,
    };

    const updatedTasks = [...tasks, newTask].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );

    setTasks(updatedTasks);
    setTask('');
    setPriority(selectedPriority);
    setModalVisible(false);
    await saveTasks(updatedTasks);

    Toast.show({
      type: 'success',
      text1: `Task added with "${selectedPriority}" priority`,
      visibilityTime: 1500,
    });
  };

  /** Delete a task by index */
  const deleteTask = async index => {
    const deleted = tasks[index]?.text;
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    Toast.show({
      type: 'info',
      text1: `Deleted: "${deleted}"`,
      visibilityTime: 1500,
    });
  };

  /** Render swipe delete button */
  const renderRightActions = index => (
    <TouchableOpacity
      onPress={() => deleteTask(index)}
      activeOpacity={0.7}
      style={styles.swipeDeleteButton}>
      <Icon name="trash-can" size={26} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  /** Filter tasks by search */
  const filteredTasks = tasks.filter(t =>
    t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>WORK LABS</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="magnify" size={22} color="#ccc" style={styles.searchIcon} />
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Add a new task..."
          placeholderTextColor="#aaa"
          value={task}
          onChangeText={setTask}
          onSubmitEditing={handleAddButtonPress}
        />
        <View style={styles.iconWrapper}>
          <TouchableOpacity onPress={handleAddButtonPress}>
            <Icon
              name={task.trim() ? 'check' : 'plus'}
              size={22}
              color="#00b894"
              style={styles.plusIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Priority Modal */}
      <PickerModal
        title="Select Task Priority"
        isVisible={isModalVisible}
        data={PRIORITIES}
        onPress={handlePrioritySelect}
        onCancelPress={() => setModalVisible(false)}
        onBackdropPress={() => setModalVisible(false)}
      />

      {/* Task List */}
      <FlatList
        style={styles.flatlist}
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <Swipeable renderRightActions={() => renderRightActions(index)}>
            <View
              style={[
                styles.taskItem,
                {
                  borderLeftColor:
                    item.priority === 'high'
                      ? '#ff6b6b'
                      : item.priority === 'medium'
                      ? '#ffa502'
                      : '#2ed573',
                },
              ]}>
              <Text style={styles.taskText}>{item.text}</Text>
            </View>
          </Swipeable>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleAddButtonPress}
        style={[
          styles.addButton,
          {backgroundColor: task.trim() ? '#00b894' : '#6C63FF'},
        ]}>
        <Icon
          name={task.trim() ? 'check' : 'plus'}
          style={styles.addButtonText}
        />
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

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
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchContainer: {
    width: '95%',
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    color: '#ffffff',
    height: verticalScale(45),
    paddingHorizontal: scale(12),
    borderRadius: scale(5),
    fontSize: moderateScale(16),
  },

  input: {
    flex: 1,
    color: '#ffffff',
    height: verticalScale(45),
    fontSize: moderateScale(16),
    paddingHorizontal: scale(10),
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  taskItem: {
    backgroundColor: '#1E1E1E',
    minHeight: 60,
    borderRadius: 7,
    borderLeftWidth: 5,
    width: '100%',
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  taskText: {
    fontSize: 16,
    color: '#ffffff',
    flexShrink: 1,
    flex: 1,
    lineHeight: 22,
    marginRight: 10,
    fontFamily:
      Platform.OS === 'android' ? 'sans-serif-light' : 'Times New Roman',
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
});

export default HomeScreen;
