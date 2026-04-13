import { 
  StyleSheet 
} from 'react-native';


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },

  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginVertical: 20, 
    textAlign: 'center' 
  },

  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  alarmText: {
    marginLeft: 12,
    fontSize: 18,
    flex: 1,
    lineHeight: 26,
  },

    // style for "create alarm" button
    //GPT was used here to scale proportionally
    createButton: {
      marginTop: 10,
      paddingVertical: 16,
      borderRadius: 10,
      backgroundColor: '#4CAF50',
      alignItems: 'center',
    },

    createButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },

    //delete button for each alarm batch/set
    //GPT was used here to scale proportionally
    deleteButton: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#fff', //white border
      backgroundColor: '#d32f2f', //red fill
    },

    deleteButtonText: {
      fontWeight: '600',
      color: '#fff',
      fontSize: 16,
    },

  emptyText: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#888', 
    fontSize: 16 
  },

  summary: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  summaryLabel: { 
    fontWeight: 'bold', 
    marginTop: 12,
    marginBottom: 6,
    fontSize: 15,
  },

  timeText: { 
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',

    // slight shadow to make touchable noticeable
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },

  clickable: { 
    color: '#2196F3', 
    marginVertical: 4, 
    fontWeight: '500' 
  },

  intervalPicker: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },

  intervalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },

  intervalText: {
    fontSize: 18,
    fontWeight: '500',
  },
});


export default styles;