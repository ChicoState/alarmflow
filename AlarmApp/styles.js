import { 
  StyleSheet 
} from 'react-native';


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  alarmText: { marginLeft: 12, fontSize: 16, flex: 1 },

    //delete button for each alarm batch/set
    deleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#fff', //white border
      backgroundColor: '#d32f2f', //red fill
    },
    deleteButtonText: {
      fontWeight: '600',
      color: '#fff',
    },

  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
  summary: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryLabel: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  timeText: { fontSize: 18 },
  clickable: { color: '#2196F3', marginVertical: 4, fontWeight: '500' },
  intervalPicker: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  intervalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
});


export default styles;