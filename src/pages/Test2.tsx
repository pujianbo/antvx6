import React, { useState } from 'react';
export default function App() {
    const [num, updateNum] = useState(0);
    return (
        <div>
            <input value={num} onChange={(e) => updateNum(+e.target.value)} />
            <p>num is {num}</p>
            <ExpensiveCpn />
        </div>)
}
const ExpensiveCpn = React.memo(() => {
    let now = performance.now();
    while (performance.now() - now < 100) {
        console.log('耗时的组件 render');
    }
    return <p>耗时的组件</p>;
})

