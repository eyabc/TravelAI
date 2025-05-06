describe('Login Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.text('TravelAI'))).toBeVisible();
    await expect(element(by.text('당신의 여행 파트너'))).toBeVisible();
  });

  it('should have email and password inputs', async () => {
    await expect(element(by.placeholderText('이메일'))).toBeVisible();
    await expect(element(by.placeholderText('비밀번호'))).toBeVisible();
  });

  it('should have login and signup buttons', async () => {
    await expect(element(by.text('로그인'))).toBeVisible();
    await expect(element(by.text('계정이 없으신가요? 회원가입'))).toBeVisible();
  });

  it('should show animation', async () => {
    // 애니메이션이 표시되는지 확인
    await expect(element(by.id('animation-container'))).toBeVisible();
  });

  it('should handle email input', async () => {
    const emailInput = element(by.placeholderText('이메일'));
    await emailInput.tap();
    await emailInput.typeText('test@example.com');
    await expect(emailInput).toHaveText('test@example.com');
  });

  it('should handle password input', async () => {
    const passwordInput = element(by.placeholderText('비밀번호'));
    await passwordInput.tap();
    await passwordInput.typeText('password123');
    await expect(passwordInput).toHaveText('password123');
  });

  it('should show error for invalid email format', async () => {
    const emailInput = element(by.placeholderText('이메일'));
    await emailInput.tap();
    await emailInput.typeText('invalid-email');
    
    const loginButton = element(by.text('로그인'));
    await loginButton.tap();
    
    // TODO: 에러 메시지 표시 로직 구현 후 테스트 추가
  });
}); 