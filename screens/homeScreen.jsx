import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PickerModal from '@freakycoder/react-native-picker-modal';
import {Swipeable} from 'react-native-gesture-handler';
import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';

const HomeScreen = () => {
  const {width, height} = useWindowDimensions();

  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const inputRef = useRef(null);
  const priorities = ['high', 'medium', 'low'];

  // Load saved tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.log('Error while loading tasks:', error);
      }
    };
    loadTasks();
  }, []);

  // when user taps add button handleAddButtonPress
  const handleAddButtonPress = () => {
    inputRef.current.blur();
    setTimeout(() => {
      inputRef.current.focus(); // refocus to ensure keyboard opens
    }, 100);
    if (task.trim().length > 0) {
      setModalVisible(true);
    }
  };

  // When priority is selected from modal
  const handlePrioritySelect = async selectedPriority => {
    const formattedPriority = selectedPriority.toLowerCase();

    const newTask = {
      id: Date.now().toString(),
      text: task.trim(),
      priority: formattedPriority,
    };

    const updatedTasks = [...tasks, newTask].sort((a, b) => {
      const priorityOrder = {high: 0, medium: 1, low: 2};
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setTasks(updatedTasks);
    setTask('');
    setPriority(formattedPriority);
    setModalVisible(false);

    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      Toast.show({
        type: 'success',
        text1: `Task added with "${formattedPriority}" priority`,
        visibilityTime: 1500,
      });
    } catch (error) {
      console.log('Error saving task:', error);
    }
  };

  // Delete task function
  const deleteTask = async index => {
    const deletedTask = tasks[index].text;
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);

    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      Toast.show({
        type: 'info',
        text1: `Deleted: "${deletedTask}"`,
        visibilityTime: 1500,
      });
    } catch (error) {
      console.log('Error deleting task:', error);
    }
  };

  // swipe to delete
  const renderRightActions = index => {
    return (
      <TouchableOpacity
        onPress={() => deleteTask(index)}
        activeOpacity={0.7}
        style={styles.swipeDeleteButton}>
        <Icon name="trash-can" size={26} color="#fff" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>WORK LABS</Text>

      {/* Input */}
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
      </View>

      {/* Priority Modal */}
      <PickerModal
        title="Select Task Priority"
        isVisible={isModalVisible}
        data={priorities}
        onPress={handlePrioritySelect}
        onCancelPress={() => setModalVisible(false)}
        onBackdropPress={() => setModalVisible(false)}
      />

      {/* Tasks List */}
      <FlatList
        style={styles.flatlist}
        data={tasks}
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

      {/* Add Task Button */}
      <TouchableOpacity
        onPress={handleAddButtonPress}
        style={[
          styles.addButton,
          {
            backgroundColor: task.trim().length > 0 ? '#00b894' : '#6C63FF',
          },
        ]}>
        <Icon
          name={task.trim().length > 0 ? 'check' : 'plus'}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily:
      Platform.OS === 'android' ? 'sans-serif-light' : 'Times New Roman',
  },
  inputContainer: {
    width: '95%',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#ffffff',
    height: 45,
    paddingHorizontal: 12,
    borderRadius: 5,
    fontSize: 16,
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
    bottom: 20,
    right: 20,
    backgroundColor: '#6C63FF',
    padding: 20,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  swipeDeleteButton: {
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '90%',
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
