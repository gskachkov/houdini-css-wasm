import React from 'react';

class Button extends React.Component {
    constructor(props) {
      super(props);
      this.state = { result: props.value };
      this.title = props.title;
      this.action = props.action;
      this.showResult = props.showResult;

      this.handleClick = this.handleClick.bind(this);
    }
  
    handleClick() {
      this.setState(prevState => ({
        result: this.action(prevState.result, this.props.value)
      }));
    }
  
    render() {
      const result = this.showResult ? (
        <p><strong>{this.state.result}</strong></p>
      ) : (
        <p></p>
      );
      return (
        <span>
          <button onClick={this.handleClick}>
            { this.title }
          </button>
          { result }
        </span>
      );
    }
  }

export default Button;