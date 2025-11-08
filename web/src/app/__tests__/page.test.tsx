// Mock the redirect function
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Home Page', () => {
  it('redirects to /events', async () => {
    const { redirect: mockRedirect } = await import('next/navigation')
    const Home = (await import('../page')).default

    Home()

    expect(mockRedirect).toHaveBeenCalledWith('/events')
  })
})
