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
    fontSize: 16, 
    flex: 1,
    lineHeight: 22,
  },

  // delete button
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#d32f2f',
  },

  deleteButtonText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 15,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',

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

  // edit function styles stuff
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  editCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },

  editHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 20,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 24,
    textAlign: 'center',
  },

  editLabel: {
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },

  editLabelSpacing: {
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
  },

  editInputBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  editInputText: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: '600',
  },

  editIntervalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  editIntervalButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },

  editIntervalButtonActive: {
    backgroundColor: '#2196F3',
  },

  editIntervalText: {
    fontWeight: '600',
    color: '#333',
  },

  editIntervalTextActive: {
    color: '#fff',
  },

  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },

  editButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  editCancelButton: {
    backgroundColor: '#EEEEEE',
  },

  editSaveButton: {
    backgroundColor: '#2196F3',
  },

  editCancelText: {
    fontWeight: '700',
    color: '#555',
    fontSize: 16,
  },

  editSaveText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 16,
  },
});


export default styles;