#!/usr/bin/env node

async function postInstall(): Promise<void> {
  console.log('🚀 Setting up git-suggest...');
  
  try {
    // Try to load dependencies, but don't fail if they're not available yet
    let checkPrerequisites: any;
    let installPrerequisites: any;
    
    try {
      const prereqModule = require('./utils/prerequisites');
      checkPrerequisites = prereqModule.checkPrerequisites;
      installPrerequisites = prereqModule.installPrerequisites;
    } catch (error) {
      // Dependencies not available yet, show manual installation instructions
      console.log('⚠ Dependencies are still being installed...');
      console.log('\nOnce installation is complete, please:');
      console.log('1. Ensure you have GitHub CLI installed: https://cli.github.com/');
      console.log('2. Install GitHub Copilot CLI: gh extension install github/gh-copilot');
      console.log('3. Authenticate with GitHub: gh auth login');
      console.log('4. Setup shell integration: git-suggest setup');
      console.log('5. Try it out: git-suggest generate');
      return;
    }
    
    // Check if prerequisites are already installed
    try {
      await checkPrerequisites();
      console.log('✓ All prerequisites are already installed');
    } catch {
      // Prerequisites missing, try to install them
      console.log('⚠ Some prerequisites are missing. Attempting to install...');
      
      try {
        await installPrerequisites();
      } catch (error) {
        console.log('✗ Failed to automatically install prerequisites');
        console.log('\nPlease install the following manually:');
        console.log('1. GitHub CLI: https://cli.github.com/');
        console.log('2. GitHub Copilot CLI: gh extension install github/gh-copilot');
        console.log('3. Authenticate: gh auth login');
        console.log('4. Setup shell integration: git-suggest setup');
        return;
      }
    }
    
    console.log('\n✓ git-suggest installed successfully!');
    console.log('\nNext steps:');
    console.log('1. Ensure you have a GitHub Copilot subscription');
    console.log('2. Authenticate with GitHub: gh auth login');
    console.log('3. Setup shell integration: git-suggest setup');
    console.log('4. Try it out: git-suggest generate');
    
  } catch (error) {
    console.error('Installation failed:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  postInstall().catch(error => {
    console.error('Post-install script failed:', error);
    process.exit(1);
  });
}

export { postInstall };