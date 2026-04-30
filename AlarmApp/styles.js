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

    //delete button for each alarm batch/set
    deleteButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#fff', //white border
      backgroundColor: '#d32f2f', //red fill
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

    // slight shadow to make touchable noticable
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },

  timeTitle: { 
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 25,
    marginVertical: 4,
    marginBottom: 35,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',

    // slight shadow to make touchable noticable
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

  fabRight: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'green',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  fabLeft: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    backgroundColor: 'green',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },

  dropdownBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    marginTop: 5,
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white'
  },

  dropdownButton: {
    paddingVertical: 10,
  },

  buttonImageIcon: {
    width: 47, 
    height: 47
  }
});


export default styles;