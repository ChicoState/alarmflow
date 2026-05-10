import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';

jest.spyOn(Alert, 'alert').mockImplementation(
    (_title, _message, buttons) => {
        const deleteButton = buttons?.find(
            (b) => b.style === 'destructive'
        );

        deleteButton?.onPress?.();
    }
);

describe('Delete alarm', () => {
    it('deletes alarm after confirmation', async () => {
        const { getByText, queryByText } = render(<App />);

        fireEvent.press(getByText('Create Alarm Set'));

        await waitFor(() => {
            expect(queryByText(/Interval:/)).toBeTruthy();
        });

        fireEvent.press(getByText('Delete'));

        await waitFor(() => {
            expect(queryByText(/Interval:/)).toBeNull();
        });
    });
});