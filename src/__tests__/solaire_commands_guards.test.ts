import { SolaireTester } from '../../test/solaire-tester';

describe('Solaire Command Guards', () => {
  it('does not call execute when guard check fails', async () => {
    const executeFn = jest.fn();
    const tester = SolaireTester({
      commands: {
        test: {
          execute: executeFn,
          guard({ ok, error }) {
            error('not allowed');
          }
        }
      }
    });

    await tester.sendMessage('test');

    expect(executeFn).not.toHaveBeenCalled();
  });
});
