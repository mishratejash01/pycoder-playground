/**
 * LeetCode-style code wrappers for multi-language support
 * Automatically handles driver code injection for Python, JavaScript, TypeScript, Java, and C++
 */

import { parseInputForLanguage, parseRawInputWithTypes } from './inputParser';

export type Language = 'python' | 'java' | 'cpp';

export interface MethodSignature {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
}

/**
 * Wraps user code with driver code for the specified language
 */
export const wrapCodeForExecution = (
  language: Language,
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  switch (language) {
    case 'python':
      return wrapPythonCode(userCode, rawInput, methodSignature);
    case 'java':
      return wrapJavaCode(userCode, rawInput, methodSignature);
    case 'cpp':
      return wrapCppCode(userCode, rawInput, methodSignature);
    default:
      return userCode;
  }
};

/**
 * Parse method signature from code to detect parameter types
 */
const parseMethodParams = (code: string, language: Language): { name: string; type: string }[] => {
  const params: { name: string; type: string }[] = [];
  
  if (language === 'java') {
    // Match Java method: public ReturnType methodName(Type1 param1, Type2 param2)
    const match = code.match(/public\s+(?:static\s+)?[\w<>\[\]]+\s+\w+\s*\(([^)]*)\)/);
    if (match && match[1]) {
      const paramStr = match[1].trim();
      if (paramStr) {
        const paramParts = paramStr.split(/,\s*/);
        for (const part of paramParts) {
          const paramMatch = part.trim().match(/([\w<>\[\]\*]+)\s+(\w+)/);
          if (paramMatch) {
            params.push({ type: paramMatch[1], name: paramMatch[2] });
          }
        }
      }
    }
  } else if (language === 'cpp') {
    // Match C++ method - handles complex types like vector<int>&, ListNode*, etc.
    const methodPatterns = [
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/,
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)/
    ];
    
    for (const pattern of methodPatterns) {
      const match = code.match(pattern);
      if (match && match[2]) {
        const paramStr = match[2].trim();
        if (paramStr) {
          // Split by comma, but be careful of template commas
          let depth = 0;
          let current = '';
          const paramParts: string[] = [];
          
          for (const char of paramStr) {
            if (char === '<') depth++;
            else if (char === '>') depth--;
            else if (char === ',' && depth === 0) {
              paramParts.push(current.trim());
              current = '';
              continue;
            }
            current += char;
          }
          if (current.trim()) paramParts.push(current.trim());
          
          for (const part of paramParts) {
            // Handle patterns like: vector<int>& nums, ListNode* l1, int target
            const paramMatch = part.trim().match(/(.*?)\s+(\w+)\s*$/);
            if (paramMatch) {
              params.push({ type: paramMatch[1].trim(), name: paramMatch[2] });
            }
          }
        }
        break;
      }
    }
  }
  
  return params;
};

/**
 * Python driver code - handles Solution class and function calls
 * FIXED: Type definitions and imports come BEFORE user code
 */
const wrapPythonCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Get parsed parameters with type info to detect ListNode/TreeNode usage
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Build arguments, converting linkedlist/tree types to builders
  const args = parsedParams.map(param => {
    if (param.type === 'linkedlist') {
      return `_build_list(${param.value})`;
    }
    if (param.type === 'tree') {
      return `_build_tree(${param.value})`;
    }
    if (param.type === 'null') return 'None';
    if (param.type === 'boolean') {
      return param.value.toLowerCase() === 'true' ? 'True' : 'False';
    }
    return param.value;
  }).join(', ');

  // IMPORTANT: Imports and class definitions MUST come BEFORE user code
  // so that type hints like Optional[ListNode] are valid when parsed
  return `# --- Auto-generated imports and type definitions ---
import sys
import json
from typing import List, Optional, Dict, Tuple, Any, Set

# ListNode and TreeNode helpers for common LeetCode problems
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _build_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head

def _build_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def _list_to_arr(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

def _tree_to_arr(root):
    if not root: return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def _serialize_output(result):
    """Convert result to LeetCode-style output format"""
    if result is None:
        return "null"
    if isinstance(result, bool):
        return "true" if result else "false"
    if isinstance(result, ListNode):
        return json.dumps(_list_to_arr(result))
    if isinstance(result, TreeNode):
        return json.dumps(_tree_to_arr(result))
    if isinstance(result, (list, tuple)):
        return json.dumps(result)
    if isinstance(result, str):
        return f'"{result}"'
    return str(result)

# --- User's Solution Code ---
${userCode}

# --- Auto-generated Driver Code ---
try:
    # Try Solution class first (LeetCode style)
    if 'Solution' in dir():
        sol = Solution()
        # Find the first non-dunder method
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
            result = method(${args})
            print(_serialize_output(result))
    else:
        # Try standalone function
        import types
        funcs = [name for name, obj in list(locals().items()) 
                 if isinstance(obj, types.FunctionType) 
                 and not name.startswith('_') 
                 and name != '_serialize_output']
        if funcs:
            func = locals()[funcs[-1]]
            result = func(${args})
            print(_serialize_output(result))
except Exception as e:
    import traceback
    print(f"Runtime Error: {type(e).__name__}: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
`;
};

/**
 * Java driver code - wraps Solution class with Main method
 * FIXED: Better handling of ListNode parameters - detect from method signature
 */
const wrapJavaCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Parse the method parameters to detect ListNode/TreeNode types
  const methodParams = parseMethodParams(userCode, 'java');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Common imports needed for LeetCode problems
  const imports = `import java.util.*;
import java.util.stream.*;
`;

  // Check if user code already has a main method
  if (userCode.includes('public static void main')) {
    return imports + userCode;
  }
  
  // Check if user already has imports
  const hasImports = userCode.includes('import java');
  
  // Detect the method name and signature from user code
  const methodPatterns = [
    /public\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)/,
    /(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
  ];
  
  let detectedMethod = 'solve';
  let returnType = 'Object';
  let paramList = '';
  
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match) {
      returnType = match[1];
      detectedMethod = match[2];
      paramList = match[3];
      if (detectedMethod !== 'Solution' && detectedMethod !== 'main') {
        break;
      }
    }
  }
  
  // Build call arguments, checking if method expects ListNode/TreeNode
  const buildCallArgs = () => {
    const callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      
      // Check if the method parameter type is ListNode
      if (methodParam && methodParam.type.includes('ListNode')) {
        // Convert array to ListNode
        if (param.type === 'array' || param.type === 'linkedlist') {
          try {
            const arr = JSON.parse(param.value);
            callArgs.push(`buildList(new int[]{${arr.join(', ')}})`);
          } catch {
            callArgs.push(`buildList(new int[]{})`);
          }
        } else {
          callArgs.push('null');
        }
      } else if (methodParam && methodParam.type.includes('TreeNode')) {
        // TreeNode handling (placeholder for now)
        callArgs.push('null');
      } else if (param.type === 'linkedlist') {
        // Detected as linkedlist by name
        try {
          const arr = JSON.parse(param.value);
          callArgs.push(`buildList(new int[]{${arr.join(', ')}})`);
        } catch {
          callArgs.push(`buildList(new int[]{})`);
        }
      } else if (param.type === 'array') {
        try {
          const arr = JSON.parse(param.value);
          if (arr.length === 0) {
            callArgs.push('new int[]{}');
          } else if (typeof arr[0] === 'number') {
            callArgs.push(`new int[]{${arr.join(', ')}}`);
          } else if (typeof arr[0] === 'string') {
            callArgs.push(`new String[]{${arr.map((s: string) => `"${s}"`).join(', ')}}`);
          } else {
            callArgs.push(`new int[]{${arr.join(', ')}}`);
          }
        } catch {
          callArgs.push(param.value);
        }
      } else if (param.type === 'array2d') {
        try {
          const arr = JSON.parse(param.value);
          const inner = arr.map((row: any[]) => `{${row.join(', ')}}`).join(', ');
          callArgs.push(`new int[][]{${inner}}`);
        } catch {
          callArgs.push(param.value);
        }
      } else if (param.type === 'string') {
        const unquoted = param.value.replace(/^['"]|['"]$/g, '');
        callArgs.push(`"${unquoted}"`);
      } else if (param.type === 'boolean') {
        callArgs.push(param.value.toLowerCase());
      } else if (param.type === 'null') {
        callArgs.push('null');
      } else {
        callArgs.push(param.value);
      }
    }
    
    return callArgs.join(', ');
  };
  
  // Wrap with main class if user only has Solution class
  if (userCode.includes('class Solution') && !userCode.includes('class Main')) {
    const callArgs = buildCallArgs();
    
    return `${imports}

// ListNode and TreeNode for common problems
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

${userCode}

class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            
            // Direct method call with properly typed arguments
            ${returnType} result = sol.${detectedMethod}(${callArgs});
            System.out.println(serializeOutput(result));
            
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
    
    static ListNode buildList(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode curr = head;
        for (int i = 1; i < arr.length; i++) {
            curr.next = new ListNode(arr[i]);
            curr = curr.next;
        }
        return head;
    }
    
    static String listToString(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        while (head != null) {
            sb.append(head.val);
            if (head.next != null) sb.append(",");
            head = head.next;
        }
        sb.append("]");
        return sb.toString();
    }
    
    static String serializeOutput(Object result) {
        if (result == null) return "null";
        if (result instanceof int[]) return Arrays.toString((int[]) result).replace(" ", "");
        if (result instanceof Integer[]) return Arrays.toString((Integer[]) result).replace(" ", "");
        if (result instanceof String[]) {
            String[] arr = (String[]) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append("\\"").append(arr[i]).append("\\"");
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof boolean[]) return Arrays.toString((boolean[]) result).replace(" ", "");
        if (result instanceof double[]) return Arrays.toString((double[]) result).replace(" ", "");
        if (result instanceof int[][]) {
            int[][] arr = (int[][]) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append(Arrays.toString(arr[i]).replace(" ", ""));
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof ListNode) return listToString((ListNode) result);
        if (result instanceof List) {
            List<?> list = (List<?>) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                Object item = list.get(i);
                if (item instanceof String) {
                    sb.append("\\"").append(item).append("\\"");
                } else if (item instanceof List) {
                    sb.append(serializeOutput(item));
                } else {
                    sb.append(item);
                }
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof Boolean) return ((Boolean) result) ? "true" : "false";
        if (result instanceof String) return "\\"" + result + "\\"";
        return result.toString();
    }
}
`;
  }
  
  return hasImports ? userCode : imports + userCode;
};

/**
 * C++ driver code - includes common headers and wraps Solution class
 * FIXED: Better handling of ListNode* parameters - detect from method signature
 */
const wrapCppCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Parse the method parameters to detect ListNode*/TreeNode* types
  const methodParams = parseMethodParams(userCode, 'cpp');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Common includes needed for LeetCode problems
  const includes = `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <algorithm>
#include <stack>
#include <queue>
#include <deque>
#include <climits>
#include <cmath>
#include <sstream>
#include <numeric>
using namespace std;
`;

  // Check if user already has includes
  const hasIncludes = userCode.includes('#include');
  const hasMain = userCode.includes('int main');
  
  if (hasMain) {
    return hasIncludes ? userCode : includes + userCode;
  }
  
  // ListNode and TreeNode definitions
  const dataStructures = `
// --- ListNode and TreeNode for common problems ---
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

ListNode* buildList(vector<int>& arr) {
    if (arr.empty()) return nullptr;
    ListNode* head = new ListNode(arr[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < arr.size(); i++) {
        curr->next = new ListNode(arr[i]);
        curr = curr->next;
    }
    return head;
}

string listToString(ListNode* head) {
    string result = "[";
    while (head) {
        result += to_string(head->val);
        if (head->next) result += ",";
        head = head->next;
    }
    result += "]";
    return result;
}
`;

  // Helper functions for output serialization
  const helpers = `
// --- Auto-generated helper functions ---
template<typename T>
void printVector(const vector<T>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        cout << v[i];
    }
    cout << "]";
}

template<>
void printVector(const vector<string>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\\"" << v[i] << "\\"";
    }
    cout << "]";
}

template<typename T>
void printVector2D(const vector<vector<T>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        printVector(v[i]);
    }
    cout << "]";
}

void printResult(int r) { cout << r; }
void printResult(long long r) { cout << r; }
void printResult(double r) { cout << r; }
void printResult(bool r) { cout << (r ? "true" : "false"); }
void printResult(const string& r) { cout << "\\"" << r << "\\""; }
void printResult(const vector<int>& r) { printVector(r); }
void printResult(const vector<long long>& r) { printVector(r); }
void printResult(const vector<double>& r) { printVector(r); }
void printResult(const vector<string>& r) { printVector(r); }
void printResult(const vector<vector<int>>& r) { printVector2D(r); }
void printResult(const vector<vector<string>>& r) { printVector2D(r); }
void printResult(const vector<bool>& r) { 
    cout << "[";
    for (size_t i = 0; i < r.size(); i++) {
        if (i > 0) cout << ",";
        cout << (r[i] ? "true" : "false");
    }
    cout << "]";
}
void printResult(ListNode* r) { cout << listToString(r); }
`;

  // Detect method name from Solution class using improved regex
  const methodPatterns = [
    /(?:const\s+)?(?:static\s+)?(?:(?:vector|list|set|map|unordered_map|unordered_set|pair|tuple|optional|queue|stack|deque|priority_queue)\s*<[^>]*(?:<[^>]*>)?[^>]*>\s*\*?\s*&?\s*)(\w+)\s*\(/,
    /(?:const\s+)?(?:static\s+)?(?:ListNode|TreeNode|Node)\s*\*\s*(\w+)\s*\(/,
    /(?:const\s+)?(?:static\s+)?(?:int|long\s+long|double|float|bool|char|string|void|size_t|unsigned)\s+(\w+)\s*\(/,
    /(?:public|private|protected)?\s*(?:const\s+)?(?:static\s+)?[\w:<>,\s*&]+\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*\{/
  ];

  let detectedMethod = methodSignature?.name || 'solve';
  
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match && match[1]) {
      const methodName = match[1];
      if (methodName !== 'Solution' && methodName !== 'main' && !methodName.startsWith('_')) {
        detectedMethod = methodName;
        break;
      }
    }
  }

  // Generate main with proper variable declarations, handling ListNode* params
  const generateCppMainWithDeclarations = () => {
    let declarations = '';
    let callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      const varName = `arg${i}`;
      
      // Check if method expects ListNode*
      if (methodParam && (methodParam.type.includes('ListNode*') || methodParam.type.includes('ListNode *'))) {
        // Convert array to ListNode*
        if (param.type === 'array' || param.type === 'linkedlist') {
          try {
            const arr = JSON.parse(param.value);
            declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
            declarations += `    ListNode* ${varName} = buildList(${varName}_arr);\n`;
            callArgs.push(varName);
          } catch {
            declarations += `    ListNode* ${varName} = nullptr;\n`;
            callArgs.push(varName);
          }
        } else {
          declarations += `    ListNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'linkedlist') {
        // Detected as linkedlist by name
        try {
          const arr = JSON.parse(param.value);
          declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
          declarations += `    ListNode* ${varName} = buildList(${varName}_arr);\n`;
          callArgs.push(varName);
        } catch {
          declarations += `    ListNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'array' || param.type === 'array2d') {
        try {
          const arr = JSON.parse(param.value);
          if (Array.isArray(arr[0])) {
            // 2D array
            const inner = arr.map((row: any[]) => `{${row.join(', ')}}`).join(', ');
            declarations += `    vector<vector<int>> ${varName} = {${inner}};\n`;
          } else if (typeof arr[0] === 'string') {
            declarations += `    vector<string> ${varName} = {${arr.map((s: string) => `"${s}"`).join(', ')}};\n`;
          } else {
            declarations += `    vector<int> ${varName} = {${arr.join(', ')}};\n`;
          }
          callArgs.push(varName);
        } catch {
          declarations += `    auto ${varName} = ${param.value};\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'string') {
        const unquoted = param.value.replace(/^['"]|['"]$/g, '');
        declarations += `    string ${varName} = "${unquoted}";\n`;
        callArgs.push(varName);
      } else if (param.type === 'null') {
        declarations += `    auto ${varName} = nullptr;\n`;
        callArgs.push(varName);
      } else {
        // Number, boolean, or other primitive
        callArgs.push(param.value);
      }
    }
    
    return `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    try {
        Solution sol;
${declarations}        auto result = sol.${detectedMethod}(${callArgs.join(', ')});
        printResult(result);
        cout << endl;
    } catch (const exception& e) {
        cerr << "Runtime Error: " << e.what() << endl;
    }
    
    return 0;
}
`;
  };

  const mainWrapper = generateCppMainWithDeclarations();

  return (hasIncludes ? '' : includes) + dataStructures + userCode + helpers + mainWrapper;
};
