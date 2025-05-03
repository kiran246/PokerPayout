import { createRef } from 'react';
import { CommonActions, StackActions } from '@react-navigation/native';

/**
 * Navigation Service for the Poker Settlement App
 * 
 * This service allows navigation from anywhere in the app without passing
 * the navigation prop through components. Useful for navigating from
 * non-screen components, services, and utilities.
 */

// Create a navigation reference that can be used across the app
export const navigationRef = createRef();

/**
 * Navigate to a route in the current navigation tree
 * 
 * @param {string} name - The name of the route to navigate to
 * @param {object} params - Parameters to pass to the route
 */
export const navigate = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    // Handle the case when navigator is not mounted yet
    console.warn('Navigation attempted before navigator initialization');
  }
};

/**
 * Navigate and reset the navigation state to just this route
 * 
 * @param {string} name - The name of the route to navigate to
 * @param {object} params - Parameters to pass to the route
 */
export const reset = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  } else {
    console.warn('Navigation reset attempted before navigator initialization');
  }
};

/**
 * Navigate to a route and clear previous screens (great for auth flows)
 * 
 * @param {string} name - The name of the route to navigate to
 * @param {object} params - Parameters to pass to the route
 */
export const resetToRoute = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  } else {
    console.warn('Navigation reset attempted before navigator initialization');
  }
};

/**
 * Push a route to the navigation stack
 * 
 * @param {string} name - The name of the route to navigate to
 * @param {object} params - Parameters to pass to the route
 */
export const push = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.push(name, params));
  } else {
    console.warn('Navigation push attempted before navigator initialization');
  }
};

/**
 * Pop the current screen and go back to the previous screen
 * 
 * @param {number} count - Number of screens to pop (default: 1)
 */
export const pop = (count = 1) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.pop(count));
  } else {
    console.warn('Navigation pop attempted before navigator initialization');
  }
};

/**
 * Go back to the previous screen
 */
export const goBack = () => {
  if (navigationRef.current && navigationRef.current.canGoBack()) {
    navigationRef.current.goBack();
  } else {
    console.warn('Cannot go back from this screen or navigator not initialized');
  }
};

/**
 * Check if we can go back from the current screen
 * 
 * @returns {boolean} Whether we can go back
 */
export const canGoBack = () => {
  if (navigationRef.current) {
    return navigationRef.current.canGoBack();
  }
  return false;
};

/**
 * Replace the current screen with a new one
 * 
 * @param {string} name - The name of the route to navigate to
 * @param {object} params - Parameters to pass to the route
 */
export const replace = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.replace(name, params));
  } else {
    console.warn('Navigation replace attempted before navigator initialization');
  }
};

/**
 * Get the current route information
 * 
 * @returns {object} The current route object or null if not available
 */
export const getCurrentRoute = () => {
  if (navigationRef.current) {
    return navigationRef.current.getCurrentRoute();
  }
  return null;
};

/**
 * Get the current route name
 * 
 * @returns {string} The current route name or null if not available
 */
export const getCurrentRouteName = () => {
  const currentRoute = getCurrentRoute();
  return currentRoute ? currentRoute.name : null;
};

// Default export as a service object
export default {
  navigate,
  reset,
  resetToRoute,
  push,
  pop,
  goBack,
  canGoBack,
  replace,
  getCurrentRoute,
  getCurrentRouteName,
  navigationRef,
};