import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

export const createDefaultChannel = async () => {
  return await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    sound: 'default',
  });
};

export const scheduleTaskNotification = async (taskId, taskText, dueDate) => {
  const channelId = await createDefaultChannel();
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: new Date(dueDate).getTime(),
  };

  return await notifee.createTriggerNotification(
    {
      id: taskId,
      title: 'Task Reminder',
      body: `"${taskText}" is due now!`,
      // body: `"${taskText}" is due at ${time}!`,

      android: {
        channelId,
        smallIcon: 'ic_launcher',
        sound: 'default',
      },
    },
    trigger
  );
};

export const cancelTaskNotification = async (taskId) => {
  await notifee.cancelNotification(taskId);
};
