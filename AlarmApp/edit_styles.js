import { 
  StyleSheet 
} from 'react-native';


const editStyles = StyleSheet.create({
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
})


export default editStyles;