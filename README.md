To run this frontend u may need this install packages or instructions in terminal:
npm install or nvm install 16
npm install -g expo-cli or npm uninstall -g expo-cli
npx expo start
npm install react-router-dom
npm install axios
npm install --save-dev @babel/core @babel/preset-flow @babel/plugin-transform-flow-strip-types
npm install @vitejs/plugin-react --save-dev
npm install @rollup/plugin-babel --save-dev
npm install @react-navigation/stack
npm install @react-native-picker/picker
expo install react-native-screens react-native-safe-area-context
expo install @react-navigation/native
If you encounter an error (such as a Switch or useHistory problem), you can try the following command to fix it：
# Check React Navigation version (may need to update) 
npm install react-navigation@latest 
 
# Check the React Router DOM version (fix Switch problem) 
npm install react-router-dom@latest 
 
# Fix ESLint or Babel issues (if any) 
npm install eslint@latest babel-eslint@latest
