import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import App from '../App';


test('Single Alarm UI', async () => {
    render(<App />);

    // check menu is closed
    const closedModal  = screen.queryByTestId('single-alarm-modal');
    expect(closedModal).toBeNull;

    // press button
    const button = screen.getByTestId('open-single-alarm-modal');
    fireEvent.press(button);
    
    // check if menu is open
    const openModal = await screen.findByTestId('single-alarm-modal')
    expect(openModal.props['visible']).toBe(true);
    
});
test('Repeat Alarm UI', async () => {
    render(<App />);

    // check menu is closed
    const closedModal  = screen.queryByTestId('repeat-alarm-modal');
    expect(closedModal).toBeNull;

    // press button
    const button = screen.getByTestId('open-repeat-alarm-modal');
    fireEvent.press(button);
    
    // check if menu is open
    const openModal = await screen.findByTestId('repeat-alarm-modal')
    expect(openModal.props['visible']).toBe(true);
    
});
test('24 Hour Switch UI toggled', async () => {
    render(<App />);

    // get current 24 hour switch setting
    const timeSwitch = await screen.findByTestId('time-switch');
    const iniTimeSetting = timeSwitch.props['value'];

    // update switch
    fireEvent(timeSwitch, 'valueChange', !iniTimeSetting);
    
    // compare settings
    const newTimeSetting = timeSwitch.props['value'];
    expect(newTimeSetting).not.toBe(iniTimeSetting);
});